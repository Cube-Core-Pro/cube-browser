"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal as TerminalIcon, 
  Plus, 
  Search, 
  Settings, 
  Copy, 
  History,
  X,
  FolderOpen,
  Maximize2,
  Minimize2,
  Download,
  RefreshCw,
  Play
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTranslation } from '@/hooks/useTranslation';
import * as terminalService from '@/lib/services/terminalService';
import type { 
  PtySession, 
  CommandResult, 
  PtyConfig,
  FileEntry,
  SystemInfo,
} from '@/lib/services/terminalService';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Types
// ============================================================================

interface HistoryEntry {
  command: string;
  result: CommandResult;
}

interface SplitPane {
  id: string;
  sessionId: string;
  size: number; // percentage
}

interface SSHProfile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  keyPath?: string;
  isFavorite: boolean;
}

interface TerminalTheme {
  name: string;
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
}

interface CommandSnippet {
  id: string;
  name: string;
  command: string;
  description: string;
  category: string;
}

const defaultThemes: Record<string, TerminalTheme> = {
  'Default Dark': {
    name: 'Default Dark',
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
  },
  'Dracula': {
    name: 'Dracula',
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
  },
  'Monokai': {
    name: 'Monokai',
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
  },
  'Nord': {
    name: 'Nord',
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#d8dee9',
    selection: '#434c5e',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
  },
  'Solarized Dark': {
    name: 'Solarized Dark',
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
  },
  'One Dark': {
    name: 'One Dark',
    background: '#282c34',
    foreground: '#abb2bf',
    cursor: '#528bff',
    selection: '#3e4451',
    black: '#282c34',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
  },
};

const defaultSnippets: CommandSnippet[] = [
  { id: '1', name: 'List All', command: 'ls -la', description: 'List all files with details', category: 'Files' },
  { id: '2', name: 'Disk Usage', command: 'df -h', description: 'Show disk usage', category: 'System' },
  { id: '3', name: 'Memory Usage', command: 'free -m', description: 'Show memory usage', category: 'System' },
  { id: '4', name: 'Process List', command: 'ps aux | head -20', description: 'Show running processes', category: 'System' },
  { id: '5', name: 'Git Status', command: 'git status', description: 'Show git status', category: 'Git' },
  { id: '6', name: 'Git Log', command: 'git log --oneline -10', description: 'Show recent commits', category: 'Git' },
  { id: '7', name: 'Docker PS', command: 'docker ps -a', description: 'List all containers', category: 'Docker' },
  { id: '8', name: 'NPM Install', command: 'npm install', description: 'Install dependencies', category: 'Node' },
  { id: '9', name: 'Find Files', command: 'find . -name "*.txt"', description: 'Find text files', category: 'Files' },
  { id: '10', name: 'Network Info', command: 'ifconfig || ip addr', description: 'Show network interfaces', category: 'Network' },
];

// ============================================================================
// Main Component
// ============================================================================

export default function TerminalPage() {
  const { t } = useTranslation();
  
  // State
  const [sessions, setSessions] = useState<PtySession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<Map<string, HistoryEntry[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [config, setConfig] = useState<PtyConfig | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [historyPosition, setHistoryPosition] = useState(-1);
  const [completions, setCompletions] = useState<string[]>([]);
  const [showCompletions, setShowCompletions] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Advanced Features State
  const [_splitLayout, setSplitLayout] = useState<'none' | 'horizontal' | 'vertical'>('none');
  const [_splitPanes, setSplitPanes] = useState<SplitPane[]>([]);
  const [_sshProfiles, setSshProfiles] = useState<SSHProfile[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('Default Dark');
  const [_snippets, setSnippets] = useState<CommandSnippet[]>(defaultSnippets);
  const [_showSSHManager, setShowSSHManager] = useState(false);
  const [_showThemeSelector, setShowThemeSelector] = useState(false);
  const [_showSnippets, setShowSnippets] = useState(false);
  const [_settingsTab, _setSettingsTab] = useState('general');
  
  // SSH Form State
  const [newSSHName, setNewSSHName] = useState('');
  const [newSSHHost, setNewSSHHost] = useState('');
  const [newSSHPort, setNewSSHPort] = useState(22);
  const [newSSHUser, setNewSSHUser] = useState('');
  const [newSSHAuthMethod, _setNewSSHAuthMethod] = useState<'password' | 'key'>('password');
  const [newSSHKeyPath, setNewSSHKeyPath] = useState('');

  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Get current theme
  const _currentTheme = defaultThemes[selectedTheme] || defaultThemes['Default Dark'];

  // ============================================================================
  // Data Loading
  // ============================================================================

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadFileExplorer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [sessionsData, configData, sysInfo] = await Promise.all([
        terminalService.getAllSessions(),
        terminalService.getConfig(),
        terminalService.getSystemInfo(),
      ]);
      
      setSessions(sessionsData);
      setConfig(configData);
      setSystemInfo(sysInfo);

      // Create initial session if none exist
      if (sessionsData.length === 0) {
        const newSession = await terminalService.createSession('Main', sysInfo.home);
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
      } else if (!activeSessionId) {
        setActiveSessionId(sessionsData[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('terminal.errors.loadFailed');
      setError(errorMessage);
      log.error('Failed to load terminal data:', err);
      toast({
        title: t('terminal.errors.title'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeSessionId, t, toast]);

  const handleRetry = useCallback(() => {
    setError(null);
    loadData();
  }, [loadData]);

  const loadFileExplorer = async () => {
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session) return;
    
    try {
      const entries = await terminalService.listDirectory(session.working_directory);
      setFileEntries(entries);
    } catch (error) {
      log.error('Failed to load directory:', error);
    }
  };

  // ============================================================================
  // Session Management
  // ============================================================================

  const createNewSession = async () => {
    try {
      const home = systemInfo?.home || '/Users';
      const newSession = await terminalService.createSession(
        `Session ${sessions.length + 1}`,
        home
      );
      
      setSessions(prev => [...prev, newSession]);
      setActiveSessionId(newSession.id);
      
      toast({ title: 'Session Created', description: newSession.name });
    } catch (error) {
      log.error('Failed to create session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create session',
        variant: 'destructive',
      });
    }
  };

  const closeSession = async (sessionId: string) => {
    try {
      await terminalService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setHistory(prev => {
        const newHistory = new Map(prev);
        newHistory.delete(sessionId);
        return newHistory;
      });
      
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setActiveSessionId(remaining[0]?.id || null);
      }
      
      toast({ title: 'Session Closed' });
    } catch (error) {
      log.error('Failed to close session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to close session',
        variant: 'destructive',
      });
    }
  };

  // ============================================================================
  // Split Panes
  // ============================================================================
  
  const _splitHorizontal = async () => {
    if (!activeSessionId) return;
    
    try {
      const newSession = await terminalService.createSession(
        `Split ${sessions.length + 1}`,
        systemInfo?.home || '/Users'
      );
      
      setSessions(prev => [...prev, newSession]);
      setSplitLayout('horizontal');
      setSplitPanes([
        { id: '1', sessionId: activeSessionId, size: 50 },
        { id: '2', sessionId: newSession.id, size: 50 },
      ]);
      
      toast({ title: 'Split Horizontal', description: 'Terminal split horizontally' });
    } catch (error) {
      log.error('Failed to split:', error);
    }
  };
  
  const _splitVertical = async () => {
    if (!activeSessionId) return;
    
    try {
      const newSession = await terminalService.createSession(
        `Split ${sessions.length + 1}`,
        systemInfo?.home || '/Users'
      );
      
      setSessions(prev => [...prev, newSession]);
      setSplitLayout('vertical');
      setSplitPanes([
        { id: '1', sessionId: activeSessionId, size: 50 },
        { id: '2', sessionId: newSession.id, size: 50 },
      ]);
      
      toast({ title: 'Split Vertical', description: 'Terminal split vertically' });
    } catch (error) {
      log.error('Failed to split:', error);
    }
  };
  
  const _closeSplit = () => {
    setSplitLayout('none');
    setSplitPanes([]);
  };

  // ============================================================================
  // SSH Management
  // ============================================================================
  
  const _addSSHProfile = () => {
    if (!newSSHName || !newSSHHost || !newSSHUser) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    
    const newProfile: SSHProfile = {
      id: Date.now().toString(),
      name: newSSHName,
      host: newSSHHost,
      port: newSSHPort,
      username: newSSHUser,
      authMethod: newSSHAuthMethod,
      keyPath: newSSHKeyPath || undefined,
      isFavorite: false,
    };
    
    setSshProfiles(prev => [...prev, newProfile]);
    setNewSSHName('');
    setNewSSHHost('');
    setNewSSHPort(22);
    setNewSSHUser('');
    setNewSSHKeyPath('');
    
    toast({ title: 'SSH Profile Added', description: newProfile.name });
  };
  
  const _connectSSH = async (profile: SSHProfile) => {
    const sshCommand = profile.authMethod === 'key' && profile.keyPath
      ? `ssh -i ${profile.keyPath} ${profile.username}@${profile.host} -p ${profile.port}`
      : `ssh ${profile.username}@${profile.host} -p ${profile.port}`;
    
    setCommandInput(sshCommand);
    setShowSSHManager(false);
    toast({ title: 'SSH Command Ready', description: 'Press Enter to connect' });
  };
  
  const _toggleSSHFavorite = (profileId: string) => {
    setSshProfiles(prev => prev.map(p => 
      p.id === profileId ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };
  
  const _removeSSHProfile = (profileId: string) => {
    setSshProfiles(prev => prev.filter(p => p.id !== profileId));
    toast({ title: 'SSH Profile Removed' });
  };

  // ============================================================================
  // Snippets
  // ============================================================================
  
  const _runSnippet = (snippet: CommandSnippet) => {
    setCommandInput(snippet.command);
    setShowSnippets(false);
    inputRef.current?.focus();
  };
  
  const _addSnippet = (name: string, command: string, description: string, category: string) => {
    const newSnippet: CommandSnippet = {
      id: Date.now().toString(),
      name,
      command,
      description,
      category,
    };
    setSnippets(prev => [...prev, newSnippet]);
    toast({ title: 'Snippet Added', description: name });
  };
  
  const _removeSnippet = (snippetId: string) => {
    setSnippets(prev => prev.filter(s => s.id !== snippetId));
  };

  // ============================================================================
  // Theme Management
  // ============================================================================
  
  const _applyTheme = (themeName: string) => {
    setSelectedTheme(themeName);
    setShowThemeSelector(false);
    toast({ title: 'Theme Applied', description: themeName });
  };

  // ============================================================================
  // Command Execution
  // ============================================================================

  const executeCommand = useCallback(async () => {
    if (!commandInput.trim() || !activeSessionId || executing) return;

    const command = commandInput.trim();
    setCommandInput('');
    setExecuting(true);
    setShowCompletions(false);
    setHistoryPosition(-1);

    try {
      const result = await terminalService.executeCommand({
        session_id: activeSessionId,
        command,
      });

      // Update history
      setHistory(prev => {
        const newHistory = new Map(prev);
        const sessionHistory = newHistory.get(activeSessionId) || [];
        newHistory.set(activeSessionId, [...sessionHistory, { command, result }]);
        return newHistory;
      });

      // Update session working directory if changed
      const session = sessions.find(s => s.id === activeSessionId);
      if (session && result.working_directory !== session.working_directory) {
        setSessions(prev => prev.map(s => 
          s.id === activeSessionId 
            ? { ...s, working_directory: result.working_directory }
            : s
        ));
        loadFileExplorer();
      }

      // Scroll to bottom
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, 10);
    } catch (error) {
      log.error('Failed to execute command:', error);
      
      // Add error to history
      setHistory(prev => {
        const newHistory = new Map(prev);
        const sessionHistory = newHistory.get(activeSessionId) || [];
        newHistory.set(activeSessionId, [...sessionHistory, { 
          command, 
          result: {
            session_id: activeSessionId,
            command,
            stdout: '',
            stderr: error instanceof Error ? error.message : 'Command failed',
            exit_code: 1,
            duration_ms: 0,
            working_directory: sessions.find(s => s.id === activeSessionId)?.working_directory || '',
            executed_at: Date.now() / 1000,
          }
        }]);
        return newHistory;
      });
    } finally {
      setExecuting(false);
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandInput, activeSessionId, executing, sessions]);

  // ============================================================================
  // Key Handling
  // ============================================================================

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const sessionHistory = activeSessionId ? history.get(activeSessionId) || [] : [];
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        executeCommand();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (sessionHistory.length > 0) {
          const newPos = historyPosition === -1 
            ? sessionHistory.length - 1 
            : Math.max(0, historyPosition - 1);
          setHistoryPosition(newPos);
          setCommandInput(sessionHistory[newPos]?.command || '');
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (historyPosition >= 0) {
          const newPos = historyPosition + 1;
          if (newPos >= sessionHistory.length) {
            setHistoryPosition(-1);
            setCommandInput('');
          } else {
            setHistoryPosition(newPos);
            setCommandInput(sessionHistory[newPos]?.command || '');
          }
        }
        break;
        
      case 'Tab':
        e.preventDefault();
        if (activeSessionId && commandInput) {
          const session = sessions.find(s => s.id === activeSessionId);
          if (session) {
            const suggestions = await terminalService.getCompletions(
              commandInput,
              session.working_directory
            );
            if (suggestions.length === 1) {
              const parts = terminalService.parseCommandLine(commandInput);
              parts[parts.length - 1] = suggestions[0];
              setCommandInput(parts.join(' ') + (suggestions[0].endsWith('/') ? '' : ' '));
              setShowCompletions(false);
            } else if (suggestions.length > 1) {
              setCompletions(suggestions);
              setShowCompletions(true);
            }
          }
        }
        break;
        
      case 'Escape':
        setShowCompletions(false);
        break;
        
      case 'c':
        if (e.ctrlKey) {
          setCommandInput('');
          setShowCompletions(false);
        }
        break;
        
      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          if (activeSessionId) {
            setHistory(prev => {
              const newHistory = new Map(prev);
              newHistory.set(activeSessionId, []);
              return newHistory;
            });
          }
        }
        break;
    }
  }, [activeSessionId, history, historyPosition, commandInput, sessions, executeCommand]);

  // ============================================================================
  // File Explorer Actions
  // ============================================================================

  const changeDirectory = async (path: string) => {
    if (!activeSessionId) return;
    
    try {
      const result = await terminalService.executeCommand({
        session_id: activeSessionId,
        command: `cd "${path}"`,
      });
      
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, working_directory: result.working_directory }
          : s
      ));
      
      const entries = await terminalService.listDirectory(result.working_directory);
      setFileEntries(entries);
    } catch (error) {
      log.error('Failed to change directory:', error);
    }
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const exportHistory = () => {
    if (!activeSessionId) return;
    
    const sessionHistory = history.get(activeSessionId) || [];
    const content = sessionHistory.map(h => 
      `$ ${h.command}\n${h.result.stdout}${h.result.stderr ? `\nERROR: ${h.result.stderr}` : ''}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-history-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <AppLayout tier="elite">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <TerminalIcon className="w-16 h-16 text-primary animate-pulse" />
            <div className="text-foreground text-xl">Loading Terminal...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const sessionHistory = activeSessionId ? history.get(activeSessionId) || [] : [];

  const filteredHistory = searchQuery
    ? sessionHistory.filter(h => 
        h.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.result.stdout.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessionHistory;

  return (
    <AppLayout tier="elite">
      {/* M5: Loading State */}
      {loading && (
        <LoadingState
          title={t('terminal.loading.title')}
          description={t('terminal.loading.description')}
          className="min-h-[60vh]"
        />
      )}

      {/* M5: Error State */}
      {!loading && error && (
        <ErrorState
          title={t('terminal.errors.title')}
          message={error}
          onRetry={handleRetry}
          className="min-h-[60vh]"
        />
      )}

      {/* M5: Main Content */}
      {!loading && !error && (
      <div className={`flex-1 flex flex-col overflow-hidden ${isMaximized ? 'fixed inset-0 z-50 bg-background' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('terminal.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('terminal.subtitle')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFileExplorer(!showFileExplorer)}
              className={`p-2 rounded-lg transition-colors ${
                showFileExplorer 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
              title={t('terminal.actions.fileExplorer')}
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-lg transition-colors ${
                showHistory 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
              title={t('terminal.actions.history')}
            >
              <History className="w-5 h-5" />
            </button>
            
            <button
              onClick={exportHistory}
              className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent transition-colors"
              title={t('terminal.actions.exportHistory')}
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent transition-colors"
              title={t('terminal.actions.settings')}
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent transition-colors"
              title={isMaximized ? t('terminal.actions.minimize') : t('terminal.actions.maximize')}
            >
              {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            
            <button
              onClick={createNewSession}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              {t('terminal.actions.newSession')}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          {showFileExplorer && (
            <div className="w-64 border-r border-border bg-card overflow-hidden flex flex-col">
              <div className="p-3 border-b border-border">
                <div className="text-sm font-medium text-foreground truncate">
                  {activeSession?.working_directory}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {/* Parent directory */}
                <button
                  onClick={() => changeDirectory('..')}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  ..
                </button>
                
                {fileEntries.map((entry) => (
                  <button
                    key={entry.path}
                    onClick={() => {
                      if (entry.file_type === 'directory') {
                        changeDirectory(entry.path);
                      } else {
                        setCommandInput(`cat "${entry.path}"`);
                        inputRef.current?.focus();
                      }
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-accent rounded transition-colors"
                  >
                    {entry.file_type === 'directory' ? (
                      <FolderOpen className="w-4 h-4 text-blue-400" />
                    ) : (
                      <div className="w-4 h-4 text-muted-foreground">📄</div>
                    )}
                    <span className="truncate flex-1 text-left">{entry.name}</span>
                    {entry.file_type !== 'directory' && (
                      <span className="text-xs text-muted-foreground">
                        {terminalService.formatFileSize(entry.size)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Terminal Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Session Tabs */}
            <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 border-b border-border overflow-x-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-colors ${
                    activeSessionId === session.id
                      ? 'bg-card text-foreground'
                      : 'text-muted-foreground hover:bg-card/50'
                  }`}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <TerminalIcon className="w-4 h-4" />
                  <span className="text-sm">{session.name}</span>
                  {session.pid && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-1 rounded">
                      PID: {session.pid}
                    </span>
                  )}
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeSession(session.id);
                      }}
                      className="p-0.5 hover:bg-destructive/20 rounded transition-colors"
                      title="Close session"
                      aria-label={`Close ${session.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* History Search */}
            {showHistory && (
              <div className="p-3 border-b border-border bg-card">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search command history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Terminal Output */}
            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-gray-950"
              onClick={() => inputRef.current?.focus()}
            >
              {/* Welcome message */}
              {filteredHistory.length === 0 && (
                <div className="text-gray-500 mb-4">
                  <div className="text-green-400 font-bold mb-2">
                    CUBE Elite Terminal v6.0
                  </div>
                  <div>Real command execution with PTY support</div>
                  <div>Type commands below to get started.</div>
                  <div className="mt-2 text-xs">
                    <span className="text-blue-400">Tips:</span> Use ↑↓ for history, Tab for completion, Ctrl+L to clear
                  </div>
                </div>
              )}

              {/* Command history */}
              {filteredHistory.map((entry, index) => (
                <div key={index} className="mb-4 group">
                  {/* Command prompt */}
                  <div className="flex items-start gap-2">
                    <span className="text-green-400 select-none">
                      {systemInfo?.user || 'user'}@cube
                    </span>
                    <span className="text-blue-400 select-none">
                      {entry.result.working_directory.split('/').pop() || '/'}
                    </span>
                    <span className="text-gray-400 select-none">$</span>
                    <span className="text-white flex-1">{entry.command}</span>
                    <button
                      onClick={() => copyToClipboard(entry.command)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                      title="Copy command"
                    >
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>

                  {/* Command output */}
                  {entry.result.stdout && (
                    <pre className="ml-4 text-gray-300 whitespace-pre-wrap overflow-x-auto">
                      {entry.result.stdout}
                    </pre>
                  )}

                  {/* Error output */}
                  {entry.result.stderr && (
                    <pre className="ml-4 text-red-400 whitespace-pre-wrap overflow-x-auto">
                      {entry.result.stderr}
                    </pre>
                  )}

                  {/* Command metadata */}
                  <div className="ml-4 mt-1 flex items-center gap-3 text-xs text-gray-600">
                    <span>
                      Exit: {entry.result.exit_code === 0 ? (
                        <span className="text-green-500">0</span>
                      ) : (
                        <span className="text-red-500">{entry.result.exit_code}</span>
                      )}
                    </span>
                    <span>
                      Duration: {terminalService.formatDuration(entry.result.duration_ms)}
                    </span>
                    <span>
                      {terminalService.formatTimestamp(entry.result.executed_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Command Input */}
            <div className="relative bg-gray-900 border-t border-gray-800">
              {/* Tab Completions */}
              {showCompletions && completions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 bg-gray-800 border border-gray-700 max-h-40 overflow-y-auto">
                  {completions.map((completion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const parts = terminalService.parseCommandLine(commandInput);
                        parts[parts.length - 1] = completion;
                        setCommandInput(parts.join(' ') + (completion.endsWith('/') ? '' : ' '));
                        setShowCompletions(false);
                        inputRef.current?.focus();
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      {completion}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-3">
                <span className="text-green-400 text-sm font-mono">
                  {systemInfo?.user || 'user'}@cube
                </span>
                <span className="text-blue-400 text-sm font-mono">
                  {activeSession?.working_directory.split('/').pop() || '/'}
                </span>
                <span className="text-gray-400 text-sm font-mono">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={commandInput}
                  onChange={(e) => {
                    setCommandInput(e.target.value);
                    setShowCompletions(false);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent text-white outline-none font-mono text-sm placeholder-gray-600"
                  disabled={executing}
                  autoFocus
                />
                {executing ? (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Running...</span>
                  </div>
                ) : (
                  <button
                    onClick={executeCommand}
                    disabled={!commandInput.trim()}
                    className="p-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Execute command"
                    aria-label="Execute command"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && config && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Terminal Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Close settings"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Font Family
                  </label>
                  <input
                    type="text"
                    value={config.font_family}
                    onChange={(e) => setConfig({ ...config, font_family: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="JetBrains Mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={config.font_size}
                    onChange={(e) => setConfig({ ...config, font_size: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="14"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Scrollback Lines
                  </label>
                  <input
                    type="number"
                    value={config.scrollback_lines}
                    onChange={(e) => setConfig({ ...config, scrollback_lines: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Cursor Style
                  </label>
                  <select
                    value={config.cursor_style}
                    onChange={(e) => setConfig({ ...config, cursor_style: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    title="Select cursor style"
                  >
                    <option value="block">Block</option>
                    <option value="underline">Underline</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Enable Bell
                  </label>
                  <button
                    onClick={() => setConfig({ ...config, enable_bell: !config.enable_bell })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      config.enable_bell ? 'bg-primary' : 'bg-muted'
                    }`}
                    title={config.enable_bell ? 'Disable bell' : 'Enable bell'}
                    aria-label={config.enable_bell ? 'Disable bell' : 'Enable bell'}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      config.enable_bell ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-accent transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={async () => {
                    try {
                      await terminalService.updateConfig(config);
                      toast({ title: t('terminal.notifications.settingsSaved') });
                      setShowSettings(false);
                    } catch (_error) {
                      toast({
                        title: t('terminal.errors.title'),
                        description: t('terminal.errors.settingsFailed'),
                        variant: 'destructive',
                      });
                    }
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </AppLayout>
  );
}
