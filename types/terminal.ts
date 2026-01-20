/**
 * Terminal Types - Complete TypeScript Type System
 * CUBE Nexum Platform v2.0
 * 
 * Comprehensive types for terminal emulator with tabs, split panes,
 * session management, and command history.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type TerminalTheme = 'dark' | 'light' | 'monokai' | 'solarized' | 'dracula' | 'nord';
export type SplitDirection = 'horizontal' | 'vertical';
export type TerminalStatus = 'running' | 'idle' | 'error' | 'exited';
export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd';

// ============================================================================
// TERMINAL SESSION
// ============================================================================

export interface TerminalSession {
  id: string;
  title: string;
  shell: ShellType;
  cwd: string;
  pid?: number;
  status: TerminalStatus;
  created_at: number;
  last_activity: number;
  command_history: string[];
  environment: Record<string, string>;
}

export interface CreateSessionRequest {
  title?: string;
  shell?: ShellType;
  cwd?: string;
  environment?: Record<string, string>;
}

export interface SessionOutput {
  session_id: string;
  output: string;
  timestamp: number;
  is_error: boolean;
}

// ============================================================================
// TERMINAL TAB
// ============================================================================

export interface TerminalTab {
  id: string;
  title: string;
  panes: TerminalPane[];
  active_pane_id: string;
  split_layout: SplitLayout | null;
}

export interface CreateTabRequest {
  title?: string;
  cwd?: string;
  shell?: ShellType;
}

// ============================================================================
// TERMINAL PANE
// ============================================================================

export interface TerminalPane {
  id: string;
  session_id: string;
  position: PanePosition;
  size: PaneSize;
  is_active: boolean;
}

export interface PanePosition {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

export interface PaneSize {
  width: number;
  height: number;
}

export interface SplitLayout {
  direction: SplitDirection;
  ratio: number; // 0.0 to 1.0
  first: TerminalPane | SplitLayout;
  second: TerminalPane | SplitLayout;
}

// ============================================================================
// COMMAND HISTORY
// ============================================================================

export interface CommandHistoryEntry {
  id: string;
  command: string;
  output: string;
  exit_code: number;
  timestamp: number;
  duration: number;
  session_id: string;
  cwd: string;
}

export interface CommandSuggestion {
  command: string;
  description: string;
  frequency: number;
  last_used: number;
}

// ============================================================================
// TERMINAL SETTINGS
// ============================================================================

export interface TerminalSettings {
  theme: TerminalTheme;
  font_family: string;
  font_size: number;
  line_height: number;
  cursor_blink: boolean;
  cursor_style: 'block' | 'underline' | 'bar';
  scroll_sensitivity: number;
  scrollback_lines: number;
  shell_integration: boolean;
  copy_on_select: boolean;
  paste_on_right_click: boolean;
  confirm_close_tab: boolean;
  default_shell: ShellType;
  environment_variables: Record<string, string>;
}

export interface ThemeColors {
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

// ============================================================================
// TERMINAL STATE
// ============================================================================

export interface TerminalState {
  tabs: TerminalTab[];
  active_tab_id: string;
  sessions: Record<string, TerminalSession>;
  settings: TerminalSettings;
  history: CommandHistoryEntry[];
  suggestions: CommandSuggestion[];
}

// ============================================================================
// EVENTS
// ============================================================================

export interface TerminalOutputEvent {
  session_id: string;
  output: string;
  is_error: boolean;
}

export interface TerminalExitEvent {
  session_id: string;
  exit_code: number;
}

export interface TerminalResizeEvent {
  session_id: string;
  cols: number;
  rows: number;
}

export type TerminalEventType =
  | 'terminal:output'
  | 'terminal:error'
  | 'terminal:exit'
  | 'terminal:resize'
  | 'terminal:title:change';

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: ShortcutAction;
}

export type ShortcutAction =
  | 'new_tab'
  | 'close_tab'
  | 'next_tab'
  | 'prev_tab'
  | 'split_horizontal'
  | 'split_vertical'
  | 'close_pane'
  | 'next_pane'
  | 'prev_pane'
  | 'clear_terminal'
  | 'copy'
  | 'paste'
  | 'select_all'
  | 'find'
  | 'zoom_in'
  | 'zoom_out'
  | 'reset_zoom';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default terminal settings
 */
export function getDefaultSettings(): TerminalSettings {
  return {
    theme: 'dark',
    font_family: 'Monaco, "Courier New", monospace',
    font_size: 14,
    line_height: 1.5,
    cursor_blink: true,
    cursor_style: 'block',
    scroll_sensitivity: 1,
    scrollback_lines: 10000,
    shell_integration: true,
    copy_on_select: false,
    paste_on_right_click: true,
    confirm_close_tab: true,
    default_shell: getDefaultShell(),
    environment_variables: {},
  };
}

/**
 * Get default shell based on platform
 */
export function getDefaultShell(): ShellType {
  if (typeof navigator !== 'undefined') {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('win')) return 'powershell';
    if (platform.includes('mac')) return 'zsh';
    return 'bash';
  }
  return 'bash';
}

/**
 * Get shell display name
 */
export function getShellDisplayName(shell: ShellType): string {
  switch (shell) {
    case 'bash':
      return 'Bash';
    case 'zsh':
      return 'Zsh';
    case 'fish':
      return 'Fish';
    case 'powershell':
      return 'PowerShell';
    case 'cmd':
      return 'CMD';
    default:
      return shell;
  }
}

/**
 * Get shell executable path
 */
export function getShellPath(shell: ShellType): string {
  switch (shell) {
    case 'bash':
      return '/bin/bash';
    case 'zsh':
      return '/bin/zsh';
    case 'fish':
      return '/usr/bin/fish';
    case 'powershell':
      return 'powershell.exe';
    case 'cmd':
      return 'cmd.exe';
    default:
      return '/bin/bash';
  }
}

/**
 * Get theme colors
 */
export function getThemeColors(theme: TerminalTheme): ThemeColors {
  switch (theme) {
    case 'dark':
      return {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      };
    case 'light':
      return {
        background: '#ffffff',
        foreground: '#383a42',
        cursor: '#383a42',
        selection: '#e5e5e6',
        black: '#383a42',
        red: '#e45649',
        green: '#50a14f',
        yellow: '#c18401',
        blue: '#0184bc',
        magenta: '#a626a4',
        cyan: '#0997b3',
        white: '#fafafa',
        brightBlack: '#4f525e',
        brightRed: '#e06c75',
        brightGreen: '#98c379',
        brightYellow: '#e5c07b',
        brightBlue: '#61afef',
        brightMagenta: '#c678dd',
        brightCyan: '#56b6c2',
        brightWhite: '#ffffff',
      };
    case 'monokai':
      return {
        background: '#272822',
        foreground: '#f8f8f2',
        cursor: '#f8f8f0',
        selection: '#49483e',
        black: '#272822',
        red: '#f92672',
        green: '#a6e22e',
        yellow: '#f4bf75',
        blue: '#66d9ef',
        magenta: '#ae81ff',
        cyan: '#a1efe4',
        white: '#f8f8f2',
        brightBlack: '#75715e',
        brightRed: '#f92672',
        brightGreen: '#a6e22e',
        brightYellow: '#f4bf75',
        brightBlue: '#66d9ef',
        brightMagenta: '#ae81ff',
        brightCyan: '#a1efe4',
        brightWhite: '#f9f8f5',
      };
    case 'solarized':
      return {
        background: '#002b36',
        foreground: '#839496',
        cursor: '#839496',
        selection: '#073642',
        black: '#073642',
        red: '#dc322f',
        green: '#859900',
        yellow: '#b58900',
        blue: '#268bd2',
        magenta: '#d33682',
        cyan: '#2aa198',
        white: '#eee8d5',
        brightBlack: '#002b36',
        brightRed: '#cb4b16',
        brightGreen: '#586e75',
        brightYellow: '#657b83',
        brightBlue: '#839496',
        brightMagenta: '#6c71c4',
        brightCyan: '#93a1a1',
        brightWhite: '#fdf6e3',
      };
    case 'dracula':
      return {
        background: '#282a36',
        foreground: '#f8f8f2',
        cursor: '#f8f8f2',
        selection: '#44475a',
        black: '#21222c',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff',
      };
    case 'nord':
      return {
        background: '#2e3440',
        foreground: '#d8dee9',
        cursor: '#d8dee9',
        selection: '#4c566a',
        black: '#3b4252',
        red: '#bf616a',
        green: '#a3be8c',
        yellow: '#ebcb8b',
        blue: '#81a1c1',
        magenta: '#b48ead',
        cyan: '#88c0d0',
        white: '#e5e9f0',
        brightBlack: '#4c566a',
        brightRed: '#bf616a',
        brightGreen: '#a3be8c',
        brightYellow: '#ebcb8b',
        brightBlue: '#81a1c1',
        brightMagenta: '#b48ead',
        brightCyan: '#8fbcbb',
        brightWhite: '#eceff4',
      };
    default:
      return getThemeColors('dark');
  }
}

/**
 * Format terminal output (strip ANSI codes)
 */
export function stripAnsiCodes(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Format command duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Parse command line
 */
export function parseCommand(commandLine: string): {
  command: string;
  args: string[];
} {
  const parts = commandLine.trim().split(/\s+/);
  return {
    command: parts[0] || '',
    args: parts.slice(1),
  };
}

/**
 * Get command suggestions from history
 */
export function getSuggestionsFromHistory(
  history: CommandHistoryEntry[],
  prefix: string
): CommandSuggestion[] {
  const commandFrequency = new Map<string, { count: number; lastUsed: number }>();

  // Count command frequency
  history.forEach((entry) => {
    const { command } = parseCommand(entry.command);
    if (command.startsWith(prefix)) {
      const existing = commandFrequency.get(command);
      if (existing) {
        commandFrequency.set(command, {
          count: existing.count + 1,
          lastUsed: Math.max(existing.lastUsed, entry.timestamp),
        });
      } else {
        commandFrequency.set(command, {
          count: 1,
          lastUsed: entry.timestamp,
        });
      }
    }
  });

  // Convert to suggestions
  const suggestions: CommandSuggestion[] = [];
  commandFrequency.forEach((data, command) => {
    suggestions.push({
      command,
      description: getCommandDescription(command),
      frequency: data.count,
      last_used: data.lastUsed,
    });
  });

  // Sort by frequency and recency
  suggestions.sort((a, b) => {
    if (a.frequency !== b.frequency) {
      return b.frequency - a.frequency;
    }
    return b.last_used - a.last_used;
  });

  return suggestions.slice(0, 10);
}

/**
 * Get command description
 */
function getCommandDescription(command: string): string {
  const descriptions: Record<string, string> = {
    ls: 'List directory contents',
    cd: 'Change directory',
    pwd: 'Print working directory',
    mkdir: 'Create directory',
    rm: 'Remove files or directories',
    cp: 'Copy files or directories',
    mv: 'Move or rename files',
    cat: 'Display file contents',
    grep: 'Search text patterns',
    find: 'Find files',
    git: 'Version control',
    npm: 'Node package manager',
    yarn: 'Package manager',
    docker: 'Container management',
    kubectl: 'Kubernetes control',
    ssh: 'Secure shell',
    curl: 'Transfer data with URLs',
    wget: 'Download files',
    tar: 'Archive files',
    gzip: 'Compress files',
    ps: 'Process status',
    top: 'Monitor processes',
    kill: 'Terminate processes',
    chmod: 'Change file permissions',
    chown: 'Change file ownership',
    echo: 'Display text',
    clear: 'Clear terminal',
    exit: 'Exit shell',
  };

  return descriptions[command] || '';
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get status color
 */
export function getStatusColor(status: TerminalStatus): string {
  switch (status) {
    case 'running':
      return '#10b981'; // green
    case 'idle':
      return '#6b7280'; // gray
    case 'error':
      return '#ef4444'; // red
    case 'exited':
      return '#f59e0b'; // amber
    default:
      return '#6b7280';
  }
}

/**
 * Calculate pane sizes for split layout
 */
export function calculatePaneSizes(
  layout: SplitLayout,
  width: number,
  height: number
): Map<string, PaneSize> {
  const sizes = new Map<string, PaneSize>();

  function traverse(node: SplitLayout | TerminalPane, w: number, h: number) {
    if ('session_id' in node) {
      // Terminal pane
      sizes.set(node.id, { width: w, height: h });
    } else {
      // Split layout
      if (node.direction === 'horizontal') {
        const firstHeight = Math.floor(h * node.ratio);
        const secondHeight = h - firstHeight;
        traverse(node.first, w, firstHeight);
        traverse(node.second, w, secondHeight);
      } else {
        const firstWidth = Math.floor(w * node.ratio);
        const secondWidth = w - firstWidth;
        traverse(node.first, firstWidth, h);
        traverse(node.second, secondWidth, h);
      }
    }
  }

  traverse(layout, width, height);
  return sizes;
}

/**
 * Default keyboard shortcuts
 */
export function getDefaultShortcuts(): KeyboardShortcut[] {
  return [
    { key: 't', ctrl: true, shift: true, action: 'new_tab' },
    { key: 'w', ctrl: true, shift: true, action: 'close_tab' },
    { key: 'Tab', ctrl: true, action: 'next_tab' },
    { key: 'Tab', ctrl: true, shift: true, action: 'prev_tab' },
    { key: 'd', ctrl: true, shift: true, action: 'split_horizontal' },
    { key: 'e', ctrl: true, shift: true, action: 'split_vertical' },
    { key: 'w', ctrl: true, alt: true, action: 'close_pane' },
    { key: 'ArrowRight', ctrl: true, alt: true, action: 'next_pane' },
    { key: 'ArrowLeft', ctrl: true, alt: true, action: 'prev_pane' },
    { key: 'k', ctrl: true, shift: true, action: 'clear_terminal' },
    { key: 'c', ctrl: true, shift: true, action: 'copy' },
    { key: 'v', ctrl: true, shift: true, action: 'paste' },
    { key: 'a', ctrl: true, shift: true, action: 'select_all' },
    { key: 'f', ctrl: true, shift: true, action: 'find' },
    { key: '=', ctrl: true, action: 'zoom_in' },
    { key: '-', ctrl: true, action: 'zoom_out' },
    { key: '0', ctrl: true, action: 'reset_zoom' },
  ];
}
