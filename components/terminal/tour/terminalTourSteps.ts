/**
 * Terminal Tour Steps
 * CUBE Elite v7.0.0 - Enterprise Terminal Emulator
 * 
 * Comprehensive guided tour for PTY-based terminal features
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Terminal module
 * Covers: Sessions, commands, history, search, settings
 */
export const terminalTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'terminal-welcome',
    target: '[data-tour="terminal-module"]',
    title: '💻 Terminal Emulator',
    content: `Welcome to CUBE's enterprise terminal emulator!

**Key Features:**
• Full PTY (pseudo-terminal) support
• Multiple tabs and split panes
• Command history with search
• Customizable themes (6 options)
• xterm.js integration
• Session persistence

A true native terminal experience in your browser.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Tab Management
  // ============================================================================
  {
    id: 'terminal-tabs',
    target: '[data-tour="terminal-tabs"]',
    title: '📑 Terminal Tabs',
    content: `Manage multiple terminal sessions with tabs:

**Tab Features:**
• Create unlimited tabs
• Rename by double-clicking
• Close with × button
• Quick switch between sessions

**Each Tab Can Contain:**
• Multiple split panes
• Independent sessions
• Separate working directories

Click + to create a new terminal tab.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'management',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'terminal-new-tab',
    target: '[data-tour="new-tab-btn"]',
    title: '➕ New Tab',
    content: `Create a new terminal tab:

**New Tab Options:**
• Opens with default shell
• Starts in home directory
• Clean session state

**Keyboard Shortcut:**
\`Ctrl+Shift+T\` - New tab

Each tab starts a fresh PTY session.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'management',
    showProgress: true,
    highlightClicks: true
  },

  // ============================================================================
  // SECTION 3: Terminal Pane
  // ============================================================================
  {
    id: 'terminal-pane',
    target: '[data-tour="terminal-pane"]',
    title: '🖥️ Terminal Pane',
    content: `The main terminal interface:

**Powered by xterm.js:**
• Full ANSI escape code support
• 256 color support
• Unicode and emoji support
• Clickable links
• Selection and copy

**Shell Support:**
• Bash, Zsh, Fish
• PowerShell, CMD
• Custom shells

Interact just like a native terminal!`,
    placement: 'right',
    position: 'right',
    category: 'execution',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'terminal-split',
    target: '[data-tour="terminal-split"]',
    title: '↔️ Split Panes',
    content: `Split the terminal for multitasking:

**Split Options:**
• **Horizontal**: Side by side
• **Vertical**: Stacked top/bottom

**Use Cases:**
• Run server + watch logs
• Edit + test simultaneously
• Monitor multiple processes

**Keyboard Shortcuts:**
• \`Ctrl+Shift+H\` - Horizontal split
• \`Ctrl+Shift+V\` - Vertical split`,
    placement: 'left',
    position: 'left',
    category: 'execution',
    showProgress: true
  },
  {
    id: 'terminal-prompt',
    target: '[data-tour="terminal-prompt"]',
    title: '> Command Prompt',
    content: `The command prompt shows:

**Prompt Information:**
• Current working directory
• User@hostname
• Git branch (if configured)
• Exit code of last command

**Input Features:**
• Tab completion
• History navigation (↑/↓)
• Ctrl+C to cancel
• Ctrl+L to clear

Type commands and press Enter to execute.`,
    placement: 'top',
    position: 'top',
    category: 'execution',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: Command History
  // ============================================================================
  {
    id: 'terminal-history',
    target: '[data-tour="command-history"]',
    title: '📜 Command History',
    content: `Access your full command history:

**History Features:**
• Searchable history
• Filter by exit code
• Sort by time or duration
• Click to re-run command

**View Options:**
• All commands
• Successful only (exit 0)
• Failed only (exit ≠ 0)

**Quick Access:**
Press ↑/↓ at prompt for recent commands.`,
    placement: 'left',
    position: 'left',
    category: 'history',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'terminal-history-search',
    target: '[data-tour="history-search"]',
    title: '🔍 Search History',
    content: `Find specific commands quickly:

**Search Features:**
• Real-time filtering
• Search command text
• Search by directory

**Tips:**
• Use keywords from commands
• Search partial matches
• Combine with filters

**Keyboard:**
\`Ctrl+R\` - Reverse search in terminal`,
    placement: 'bottom',
    position: 'bottom',
    category: 'history',
    showProgress: true
  },
  {
    id: 'terminal-history-filters',
    target: '[data-tour="history-filters"]',
    title: '🎚️ History Filters',
    content: `Filter command history:

**Filter Options:**
• **All**: Complete history
• **Success**: Exit code 0
• **Error**: Exit code ≠ 0

**Sort Options:**
• **Time**: Most recent first
• **Duration**: Longest first

Useful for finding slow or failing commands.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'history',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Search Panel
  // ============================================================================
  {
    id: 'terminal-search',
    target: '[data-tour="search-panel"]',
    title: '🔎 Terminal Search',
    content: `Search within terminal output:

**Search Options:**
• Case sensitive toggle
• Regular expressions
• Navigate matches (↑/↓)

**Open Search:**
\`Ctrl+F\` or \`Cmd+F\`

**Navigate Results:**
• Enter - Next match
• Shift+Enter - Previous match
• Escape - Close search`,
    placement: 'bottom',
    position: 'bottom',
    category: 'advanced',
    showProgress: true
  },
  {
    id: 'terminal-search-options',
    target: '[data-tour="search-options"]',
    title: '⚙️ Search Options',
    content: `Advanced search configuration:

**Case Sensitive:**
Match exact case (A ≠ a)

**Regular Expressions:**
Use regex patterns:
• \`^npm\` - Lines starting with npm
• \`error|warning\` - Match either
• \`\\d+\` - Match numbers

Powerful for log analysis!`,
    placement: 'bottom',
    position: 'bottom',
    category: 'advanced',
    showProgress: true
  },

  // ============================================================================
  // SECTION 6: Settings
  // ============================================================================
  {
    id: 'terminal-settings',
    target: '[data-tour="terminal-settings"]',
    title: '⚙️ Terminal Settings',
    content: `Customize your terminal experience:

**Settings Categories:**
• Appearance (theme, font)
• Behavior (cursor, bell)
• Shell configuration
• Keyboard shortcuts

All settings persist across sessions.`,
    placement: 'left',
    position: 'left',
    category: 'settings',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'terminal-theme',
    target: '[data-tour="theme-selector"]',
    title: '🎨 Terminal Themes',
    content: `Choose your visual style:

**Available Themes:**
• **Dark**: Default dark mode
• **Light**: Light background
• **Monokai**: Classic code theme
• **Solarized**: Eye-friendly
• **Dracula**: Popular dark theme
• **Nord**: Arctic-inspired

Preview updates in real-time.`,
    placement: 'right',
    position: 'right',
    category: 'settings',
    showProgress: true
  },
  {
    id: 'terminal-font',
    target: '[data-tour="font-settings"]',
    title: '🔤 Font Configuration',
    content: `Configure terminal font:

**Settings:**
• **Font Family**: Monospace fonts
• **Font Size**: 8-32px
• **Line Height**: 1.0-3.0

**Recommended Fonts:**
• JetBrains Mono
• Fira Code
• Source Code Pro
• Cascadia Code

Use ligature fonts for better readability!`,
    placement: 'right',
    position: 'right',
    category: 'settings',
    showProgress: true
  },
  {
    id: 'terminal-cursor',
    target: '[data-tour="cursor-settings"]',
    title: '▌ Cursor Style',
    content: `Customize cursor appearance:

**Cursor Styles:**
• **Block**: Solid rectangle █
• **Underline**: Line below _
• **Bar**: Thin vertical |

**Options:**
• Cursor blink toggle
• Blink rate adjustment

Choose what feels most comfortable.`,
    placement: 'right',
    position: 'right',
    category: 'settings',
    showProgress: true
  },
  {
    id: 'terminal-shell',
    target: '[data-tour="shell-settings"]',
    title: '🐚 Shell Selection',
    content: `Choose your preferred shell:

**Available Shells:**
• **Bash**: Default Linux/Mac
• **Zsh**: macOS default
• **Fish**: Friendly interactive
• **PowerShell**: Windows advanced
• **CMD**: Windows command

**Per-Tab Override:**
Each tab can use a different shell.`,
    placement: 'right',
    position: 'right',
    category: 'settings',
    showProgress: true
  },

  // ============================================================================
  // SECTION 7: Advanced Features
  // ============================================================================
  {
    id: 'terminal-builtin',
    target: '[data-tour="builtin-commands"]',
    title: '🛠️ Built-in Commands',
    content: `CUBE provides enhanced built-in commands:

**File Operations:**
• \`ls\` / \`dir\` - List files
• \`cd\` - Change directory
• \`cat\` - View file contents

**Utilities:**
• \`clear\` - Clear screen
• \`history\` - Show history
• \`pwd\` - Print working directory

These work across all platforms!`,
    placement: 'top',
    position: 'top',
    category: 'advanced',
    showProgress: true
  },
  {
    id: 'terminal-keyboard',
    target: '[data-tour="keyboard-shortcuts"]',
    title: '⌨️ Keyboard Shortcuts',
    content: `Master terminal shortcuts:

**Navigation:**
• \`Ctrl+A\` - Start of line
• \`Ctrl+E\` - End of line
• \`Ctrl+U\` - Clear line
• \`Ctrl+K\` - Clear to end

**Control:**
• \`Ctrl+C\` - Cancel/interrupt
• \`Ctrl+D\` - Exit/EOF
• \`Ctrl+Z\` - Suspend process
• \`Ctrl+L\` - Clear screen

**Tab Management:**
• \`Ctrl+Shift+T\` - New tab
• \`Ctrl+Shift+W\` - Close tab`,
    placement: 'center',
    position: 'center',
    category: 'advanced',
    showProgress: true
  },

  // ============================================================================
  // SECTION 8: Tour Completion
  // ============================================================================
  {
    id: 'terminal-complete',
    target: '[data-tour="terminal-module"]',
    title: '✅ Terminal Tour Complete!',
    content: `You've mastered CUBE Terminal!

**Topics Covered:**
✓ Tab and pane management
✓ Command execution
✓ History search and filters
✓ Terminal search
✓ Theme customization
✓ Font and cursor settings
✓ Shell selection
✓ Keyboard shortcuts

**Pro Tips:**
• Use split panes for multitasking
• Search history with Ctrl+R
• Customize theme for eye comfort
• Learn keyboard shortcuts

**Quick Reference:**
• New tab: \`Ctrl+Shift+T\`
• Search: \`Ctrl+F\`
• Clear: \`Ctrl+L\`
• History: ↑/↓ arrows

Ready for command-line power!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Terminal
 */
export const terminalTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '💻' },
  { id: 'management', title: 'Tab Management', icon: '📑' },
  { id: 'execution', title: 'Terminal Pane', icon: '🖥️' },
  { id: 'history', title: 'History', icon: '📜' },
  { id: 'advanced', title: 'Advanced', icon: '🔎' },
  { id: 'settings', title: 'Settings', icon: '⚙️' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getTerminalStepsBySection = (sectionId: string): TourStep[] => {
  return terminalTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getTerminalRequiredSteps = (): TourStep[] => {
  return terminalTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const terminalTourConfig = {
  id: 'terminal-tour',
  name: 'Terminal Emulator Tour',
  description: 'Master the enterprise terminal with PTY support',
  version: '1.0.0',
  totalSteps: terminalTourSteps.length,
  estimatedTime: '5 minutes',
  sections: terminalTourSections,
  features: [
    'PTY sessions',
    'Multi-tab support',
    'Split panes',
    'Command history',
    'Customizable themes',
    'xterm.js integration'
  ]
};

export default terminalTourSteps;
