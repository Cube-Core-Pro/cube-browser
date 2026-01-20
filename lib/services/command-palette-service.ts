/**
 * CUBE Nexum - Command Palette Service
 * 
 * Power user features:
 * - Global command palette (Cmd/Ctrl+K)
 * - Keyboard shortcuts management
 * - Quick actions
 * - Recent commands
 * - Fuzzy search
 */

import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { logger } from './logger-service';

const log = logger.scope('CommandPalette');

// ============================================================================
// TYPES
// ============================================================================

export type CommandCategory = 
  | 'navigation'
  | 'actions'
  | 'workflows'
  | 'data'
  | 'settings'
  | 'help'
  | 'ai'
  | 'recent';

export interface Command {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  icon?: string;
  shortcut?: string;
  keywords?: string[];
  action: () => void | Promise<void>;
  enabled?: boolean;
  badge?: string;
  metadata?: Record<string, unknown>;
}

export interface CommandGroup {
  category: CommandCategory;
  title: string;
  commands: Command[];
}

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  action: () => void;
  global?: boolean;
  category: CommandCategory;
}

export interface RecentCommand {
  commandId: string;
  timestamp: number;
  count: number;
}

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

export const CATEGORY_CONFIG: Record<CommandCategory, { title: string; icon: string }> = {
  navigation: { title: 'Navigation', icon: '🧭' },
  actions: { title: 'Actions', icon: '⚡' },
  workflows: { title: 'Workflows', icon: '🔄' },
  data: { title: 'Data', icon: '📊' },
  settings: { title: 'Settings', icon: '⚙️' },
  help: { title: 'Help', icon: '❓' },
  ai: { title: 'AI Assistant', icon: '🤖' },
  recent: { title: 'Recent', icon: '🕐' },
};

// ============================================================================
// COMMAND PALETTE SERVICE
// ============================================================================

class CommandPaletteServiceClass {
  private commands: Map<string, Command> = new Map();
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private recentCommands: RecentCommand[] = [];
  private isOpen: boolean = false;
  private listeners: Set<(isOpen: boolean) => void> = new Set();

  constructor() {
    this.loadRecentCommands();
    this.setupGlobalShortcuts();
  }

  // -------------------------------------------------------------------------
  // Command Registration
  // -------------------------------------------------------------------------

  registerCommand(command: Command): void {
    this.commands.set(command.id, {
      ...command,
      enabled: command.enabled ?? true,
    });
  }

  registerCommands(commands: Command[]): void {
    commands.forEach(cmd => this.registerCommand(cmd));
  }

  unregisterCommand(id: string): void {
    this.commands.delete(id);
  }

  getCommand(id: string): Command | undefined {
    return this.commands.get(id);
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values())
      .filter(cmd => cmd.enabled !== false);
  }

  getCommandsByCategory(category: CommandCategory): Command[] {
    return this.getAllCommands().filter(cmd => cmd.category === category);
  }

  // -------------------------------------------------------------------------
  // Shortcut Registration
  // -------------------------------------------------------------------------

  registerShortcut(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  registerShortcuts(shortcuts: KeyboardShortcut[]): void {
    shortcuts.forEach(s => this.registerShortcut(s));
  }

  unregisterShortcut(id: string): void {
    this.shortcuts.delete(id);
  }

  getShortcut(id: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(id);
  }

  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  // -------------------------------------------------------------------------
  // Command Execution
  // -------------------------------------------------------------------------

  async executeCommand(id: string): Promise<void> {
    const command = this.commands.get(id);
    if (!command || command.enabled === false) {
      log.warn(`Command not found or disabled: ${id}`);
      return;
    }

    try {
      await command.action();
      this.recordRecentCommand(id);
    } catch (error) {
      log.error(`Failed to execute command: ${id}`, error);
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  search(query: string): Command[] {
    if (!query.trim()) {
      return this.getRecentCommandsAsCommands().slice(0, 5)
        .concat(this.getAllCommands().slice(0, 10));
    }

    const normalizedQuery = query.toLowerCase().trim();
    const commands = this.getAllCommands();
    
    // Score-based fuzzy search
    const scored = commands.map(cmd => ({
      command: cmd,
      score: this.calculateScore(cmd, normalizedQuery),
    }));

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.command)
      .slice(0, 20);
  }

  private calculateScore(command: Command, query: string): number {
    let score = 0;
    const title = command.title.toLowerCase();
    const description = (command.description || '').toLowerCase();
    const keywords = (command.keywords || []).map(k => k.toLowerCase());

    // Exact match in title
    if (title === query) {
      score += 100;
    }
    // Title starts with query
    else if (title.startsWith(query)) {
      score += 80;
    }
    // Title contains query
    else if (title.includes(query)) {
      score += 60;
    }

    // Description contains query
    if (description.includes(query)) {
      score += 30;
    }

    // Keywords match
    for (const keyword of keywords) {
      if (keyword === query) {
        score += 50;
      } else if (keyword.includes(query)) {
        score += 20;
      }
    }

    // Fuzzy match
    if (score === 0) {
      score += this.fuzzyMatch(title, query) * 40;
    }

    // Boost recent commands
    const recent = this.recentCommands.find(r => r.commandId === command.id);
    if (recent) {
      const recency = Date.now() - recent.timestamp;
      const recencyBonus = Math.max(0, 20 - recency / (24 * 60 * 60 * 1000));
      score += recencyBonus + Math.min(10, recent.count);
    }

    return score;
  }

  private fuzzyMatch(text: string, pattern: string): number {
    let patternIdx = 0;
    let score = 0;
    let consecutive = 0;

    for (let i = 0; i < text.length && patternIdx < pattern.length; i++) {
      if (text[i] === pattern[patternIdx]) {
        patternIdx++;
        consecutive++;
        score += consecutive;
      } else {
        consecutive = 0;
      }
    }

    return patternIdx === pattern.length ? score / pattern.length : 0;
  }

  // -------------------------------------------------------------------------
  // Recent Commands
  // -------------------------------------------------------------------------

  private recordRecentCommand(commandId: string): void {
    const existing = this.recentCommands.find(r => r.commandId === commandId);
    
    if (existing) {
      existing.timestamp = Date.now();
      existing.count++;
    } else {
      this.recentCommands.unshift({
        commandId,
        timestamp: Date.now(),
        count: 1,
      });
    }

    // Keep only last 50
    this.recentCommands = this.recentCommands
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    this.saveRecentCommands();
  }

  getRecentCommandsAsCommands(): Command[] {
    return this.recentCommands
      .map(r => this.commands.get(r.commandId))
      .filter((cmd): cmd is Command => cmd !== undefined)
      .slice(0, 10);
  }

  private loadRecentCommands(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('cube_recent_commands');
      if (stored) {
        this.recentCommands = JSON.parse(stored);
      }
    } catch {
      this.recentCommands = [];
    }
  }

  private saveRecentCommands(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('cube_recent_commands', JSON.stringify(this.recentCommands));
    } catch {
      // Ignore storage errors
    }
  }

  // -------------------------------------------------------------------------
  // Palette State
  // -------------------------------------------------------------------------

  open(): void {
    this.isOpen = true;
    this.notifyListeners();
  }

  close(): void {
    this.isOpen = false;
    this.notifyListeners();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    this.notifyListeners();
  }

  getIsOpen(): boolean {
    return this.isOpen;
  }

  subscribe(listener: (isOpen: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.isOpen));
  }

  // -------------------------------------------------------------------------
  // Global Shortcuts
  // -------------------------------------------------------------------------

  private setupGlobalShortcuts(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K: Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
        return;
      }

      // Escape: Close palette
      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
        return;
      }

      // Check registered shortcuts
      const shortcutKey = this.getShortcutKey(e);
      for (const [, shortcut] of this.shortcuts) {
        if (this.matchesShortcut(shortcut, shortcutKey)) {
          if (shortcut.global || !this.isInputFocused()) {
            e.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    });
  }

  private getShortcutKey(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.metaKey) parts.push('meta');
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (e.key && !['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
      parts.push(e.key.toLowerCase());
    }
    return parts.join('+');
  }

  private matchesShortcut(shortcut: KeyboardShortcut, key: string): boolean {
    return shortcut.keys.some(k => k.toLowerCase() === key);
  }

  private isInputFocused(): boolean {
    const active = document.activeElement;
    return active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      (active instanceof HTMLElement && active.isContentEditable);
  }

  // -------------------------------------------------------------------------
  // Format Shortcut for Display
  // -------------------------------------------------------------------------

  formatShortcut(shortcut: string): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return shortcut
      .replace(/meta\+/gi, isMac ? '⌘' : '')
      .replace(/ctrl\+/gi, isMac ? '⌃' : 'Ctrl+')
      .replace(/alt\+/gi, isMac ? '⌥' : 'Alt+')
      .replace(/shift\+/gi, isMac ? '⇧' : 'Shift+')
      .toUpperCase();
  }
}

export const CommandPaletteService = new CommandPaletteServiceClass();

// ============================================================================
// DEFAULT COMMANDS
// ============================================================================

export function registerDefaultCommands(router: { push: (path: string) => void }): void {
  const commands: Command[] = [
    // Navigation
    {
      id: 'nav:home',
      title: 'Go to Home',
      description: 'Navigate to the dashboard',
      category: 'navigation',
      icon: '🏠',
      shortcut: 'meta+shift+h',
      keywords: ['dashboard', 'main', 'start'],
      action: () => router.push('/'),
    },
    {
      id: 'nav:autofill',
      title: 'Go to Autofill',
      description: 'Manage autofill profiles',
      category: 'navigation',
      icon: '📝',
      shortcut: 'meta+shift+a',
      keywords: ['forms', 'profiles', 'fill'],
      action: () => router.push('/autofill'),
    },
    {
      id: 'nav:passwords',
      title: 'Go to Password Vault',
      description: 'Access password manager',
      category: 'navigation',
      icon: '🔐',
      shortcut: 'meta+shift+p',
      keywords: ['vault', 'credentials', 'security'],
      action: () => router.push('/password-manager'),
    },
    {
      id: 'nav:automation',
      title: 'Go to Automation',
      description: 'Build and run workflows',
      category: 'navigation',
      icon: '🤖',
      shortcut: 'meta+shift+w',
      keywords: ['workflows', 'bots', 'scraping'],
      action: () => router.push('/automation'),
    },
    {
      id: 'nav:data-extractor',
      title: 'Go to Data Extractor',
      description: 'Extract data from websites',
      category: 'navigation',
      icon: '📊',
      shortcut: 'meta+shift+d',
      keywords: ['scrape', 'extract', 'data'],
      action: () => router.push('/data-extractor'),
    },
    {
      id: 'nav:browser',
      title: 'Go to Browser',
      description: 'Open integrated browser',
      category: 'navigation',
      icon: '🌐',
      shortcut: 'meta+shift+b',
      keywords: ['web', 'browse', 'internet'],
      action: () => router.push('/browser'),
    },
    {
      id: 'nav:settings',
      title: 'Go to Settings',
      description: 'Configure application settings',
      category: 'navigation',
      icon: '⚙️',
      shortcut: 'meta+,',
      keywords: ['preferences', 'config', 'options'],
      action: () => router.push('/settings'),
    },
    {
      id: 'nav:gamification',
      title: 'Go to Rewards',
      description: 'View achievements and rewards',
      category: 'navigation',
      icon: '🏆',
      keywords: ['achievements', 'badges', 'xp', 'level'],
      action: () => router.push('/gamification'),
    },
    {
      id: 'nav:referrals',
      title: 'Go to Referrals',
      description: 'Invite friends and earn rewards',
      category: 'navigation',
      icon: '👥',
      keywords: ['invite', 'share', 'friends', 'viral'],
      action: () => router.push('/referrals'),
    },

    // Actions
    {
      id: 'action:new-workflow',
      title: 'Create New Workflow',
      description: 'Start building a new automation',
      category: 'actions',
      icon: '➕',
      shortcut: 'meta+n',
      keywords: ['new', 'create', 'automation'],
      action: () => router.push('/automation/new'),
    },
    {
      id: 'action:new-profile',
      title: 'Create Autofill Profile',
      description: 'Add a new autofill profile',
      category: 'actions',
      icon: '➕',
      keywords: ['new', 'create', 'profile', 'form'],
      action: () => router.push('/autofill/new'),
    },
    {
      id: 'action:add-password',
      title: 'Add Password',
      description: 'Save a new credential',
      category: 'actions',
      icon: '🔑',
      keywords: ['new', 'credential', 'save', 'login'],
      action: () => router.push('/password-manager/new'),
    },
    {
      id: 'action:import-data',
      title: 'Import Data',
      description: 'Import data from file',
      category: 'actions',
      icon: '📥',
      keywords: ['upload', 'file', 'csv', 'json'],
      action: () => router.push('/tools/import'),
    },
    {
      id: 'action:export-data',
      title: 'Export Data',
      description: 'Export data to file',
      category: 'actions',
      icon: '📤',
      keywords: ['download', 'backup', 'save'],
      action: () => router.push('/tools/export'),
    },
    {
      id: 'action:lock-app',
      title: 'Lock Application',
      description: 'Lock CUBE and require authentication',
      category: 'actions',
      icon: '🔒',
      shortcut: 'meta+l',
      keywords: ['security', 'protect', 'logout'],
      action: async () => {
        try {
          await invoke('lock_application');
        } catch (error) {
          log.error('Failed to lock:', error);
        }
      },
    },

    // AI Commands
    {
      id: 'ai:assistant',
      title: 'Open AI Assistant',
      description: 'Get help from AI',
      category: 'ai',
      icon: '🤖',
      shortcut: 'meta+j',
      keywords: ['help', 'chat', 'gpt', 'assistant'],
      action: () => router.push('/ai'),
    },
    {
      id: 'ai:generate-workflow',
      title: 'AI Generate Workflow',
      description: 'Create workflow from description',
      category: 'ai',
      icon: '✨',
      keywords: ['generate', 'create', 'natural language'],
      action: () => router.push('/ai?mode=workflow'),
    },
    {
      id: 'ai:analyze-page',
      title: 'AI Analyze Page',
      description: 'Analyze current page with AI',
      category: 'ai',
      icon: '🔍',
      keywords: ['analyze', 'inspect', 'understand'],
      action: async () => {
        try {
          await invoke('ai_analyze_current_page');
        } catch (error) {
          log.error('Failed to analyze:', error);
        }
      },
    },

    // Settings
    {
      id: 'settings:theme',
      title: 'Toggle Dark Mode',
      description: 'Switch between light and dark themes',
      category: 'settings',
      icon: '🌓',
      shortcut: 'meta+shift+t',
      keywords: ['dark', 'light', 'theme', 'mode'],
      action: () => {
        if (typeof window === 'undefined') return;
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      },
    },
    {
      id: 'settings:notifications',
      title: 'Notification Settings',
      description: 'Configure notification preferences',
      category: 'settings',
      icon: '🔔',
      keywords: ['alerts', 'notify', 'push'],
      action: () => router.push('/settings/notifications'),
    },
    {
      id: 'settings:security',
      title: 'Security Settings',
      description: 'Configure security options',
      category: 'settings',
      icon: '🛡️',
      keywords: ['password', '2fa', 'encryption'],
      action: () => router.push('/settings/security'),
    },
    {
      id: 'settings:shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'View and customize shortcuts',
      category: 'settings',
      icon: '⌨️',
      shortcut: 'meta+/',
      keywords: ['hotkeys', 'keys', 'bindings'],
      action: () => router.push('/settings/shortcuts'),
    },

    // Help
    {
      id: 'help:docs',
      title: 'Documentation',
      description: 'Open documentation',
      category: 'help',
      icon: '📚',
      shortcut: 'f1',
      keywords: ['docs', 'help', 'guide', 'manual'],
      action: () => { window.open('https://docs.cubenexum.com', '_blank'); },
    },
    {
      id: 'help:support',
      title: 'Contact Support',
      description: 'Get help from support team',
      category: 'help',
      icon: '💬',
      keywords: ['help', 'contact', 'issue', 'problem'],
      action: () => router.push('/help/support'),
    },
    {
      id: 'help:shortcuts-cheatsheet',
      title: 'Shortcuts Cheatsheet',
      description: 'Quick reference for all shortcuts',
      category: 'help',
      icon: '📋',
      keywords: ['reference', 'cheatsheet', 'quick'],
      action: () => router.push('/help/shortcuts'),
    },
    {
      id: 'help:whats-new',
      title: "What's New",
      description: 'See latest updates and features',
      category: 'help',
      icon: '🎉',
      keywords: ['updates', 'changelog', 'features', 'new'],
      action: () => router.push('/help/changelog'),
    },
    {
      id: 'help:feedback',
      title: 'Send Feedback',
      description: 'Share your thoughts with us',
      category: 'help',
      icon: '💡',
      keywords: ['feedback', 'suggestion', 'idea'],
      action: () => router.push('/help/feedback'),
    },
  ];

  CommandPaletteService.registerCommands(commands);
}

// ============================================================================
// REACT HOOKS
// ============================================================================

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    return CommandPaletteService.subscribe(setIsOpen);
  }, []);

  const results = useMemo(() => {
    return CommandPaletteService.search(query);
  }, [query]);

  const groupedResults = useMemo(() => {
    const groups: CommandGroup[] = [];
    const categoryMap = new Map<CommandCategory, Command[]>();

    for (const cmd of results) {
      if (!categoryMap.has(cmd.category)) {
        categoryMap.set(cmd.category, []);
      }
      categoryMap.get(cmd.category)!.push(cmd);
    }

    // Add recent first if no query
    if (!query && results.length > 0) {
      const recent = CommandPaletteService.getRecentCommandsAsCommands();
      if (recent.length > 0) {
        groups.push({
          category: 'recent',
          title: CATEGORY_CONFIG.recent.title,
          commands: recent.slice(0, 5),
        });
      }
    }

    for (const [category, commands] of categoryMap) {
      if (category !== 'recent') {
        groups.push({
          category,
          title: CATEGORY_CONFIG[category].title,
          commands,
        });
      }
    }

    return groups;
  }, [results, query]);

  const open = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    CommandPaletteService.open();
  }, []);

  const close = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    CommandPaletteService.close();
  }, []);

  const executeSelected = useCallback(async () => {
    if (results[selectedIndex]) {
      close();
      await CommandPaletteService.executeCommand(results[selectedIndex].id);
    }
  }, [results, selectedIndex, close]);

  const moveSelection = useCallback((delta: number) => {
    setSelectedIndex(prev => {
      const next = prev + delta;
      if (next < 0) return results.length - 1;
      if (next >= results.length) return 0;
      return next;
    });
  }, [results.length]);

  return {
    isOpen,
    query,
    setQuery,
    results,
    groupedResults,
    selectedIndex,
    setSelectedIndex,
    open,
    close,
    executeSelected,
    moveSelection,
  };
}

export function useKeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);

  useEffect(() => {
    setShortcuts(CommandPaletteService.getAllShortcuts());
  }, []);

  const formatShortcut = useCallback((shortcut: string) => {
    return CommandPaletteService.formatShortcut(shortcut);
  }, []);

  return { shortcuts, formatShortcut };
}

export default CommandPaletteService;
