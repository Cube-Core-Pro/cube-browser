/**
 * Terminal Pane Component - Individual terminal instance
 * CUBE Nexum Platform v2.0
 * 
 * Single terminal pane with xterm.js integration
 */

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('TerminalPane');

import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import {
  TerminalPane as ITerminalPane,
  TerminalSession,
  TerminalSettings,
  getThemeColors,
  getStatusColor,
} from '../../types/terminal';
import 'xterm/css/xterm.css';
import './TerminalPane.css';

interface TerminalPaneProps {
  pane: ITerminalPane;
  session: TerminalSession;
  settings: TerminalSettings;
  onCommand: (command: string) => Promise<string | void>;
  onClose: () => void;
  onFocus: () => void;
  onSplit: (direction: 'horizontal' | 'vertical') => void;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({
  pane,
  session,
  settings,
  onCommand,
  onClose,
  onFocus,
  onSplit,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ============================================================================
  // TERMINAL INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const themeColors = getThemeColors(settings.theme);
    const terminal = new Terminal({
      theme: {
        background: themeColors.background,
        foreground: themeColors.foreground,
        cursor: themeColors.cursor,
        selectionBackground: themeColors.selection,
        black: themeColors.black,
        red: themeColors.red,
        green: themeColors.green,
        yellow: themeColors.yellow,
        blue: themeColors.blue,
        magenta: themeColors.magenta,
        cyan: themeColors.cyan,
        white: themeColors.white,
        brightBlack: themeColors.brightBlack,
        brightRed: themeColors.brightRed,
        brightGreen: themeColors.brightGreen,
        brightYellow: themeColors.brightYellow,
        brightBlue: themeColors.brightBlue,
        brightMagenta: themeColors.brightMagenta,
        brightCyan: themeColors.brightCyan,
        brightWhite: themeColors.brightWhite,
      },
      fontFamily: settings.font_family,
      fontSize: settings.font_size,
      lineHeight: settings.line_height,
      cursorBlink: settings.cursor_blink,
      cursorStyle: settings.cursor_style,
      scrollback: settings.scrollback_lines,
      allowTransparency: true,
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.loadAddon(searchAddon);

    // Open terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Save refs
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    // Write prompt
    writePrompt(terminal);

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    // Handle input
    terminal.onData((data) => {
      handleTerminalData(terminal, data);
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // SETTINGS UPDATE
  // ============================================================================

  useEffect(() => {
    if (!xtermRef.current) return;

    const themeColors = getThemeColors(settings.theme);
    xtermRef.current.options = {
      ...xtermRef.current.options,
      theme: {
        background: themeColors.background,
        foreground: themeColors.foreground,
        cursor: themeColors.cursor,
        selectionBackground: themeColors.selection,
        black: themeColors.black,
        red: themeColors.red,
        green: themeColors.green,
        yellow: themeColors.yellow,
        blue: themeColors.blue,
        magenta: themeColors.magenta,
        cyan: themeColors.cyan,
        white: themeColors.white,
        brightBlack: themeColors.brightBlack,
        brightRed: themeColors.brightRed,
        brightGreen: themeColors.brightGreen,
        brightYellow: themeColors.brightYellow,
        brightBlue: themeColors.brightBlue,
        brightMagenta: themeColors.brightMagenta,
        brightCyan: themeColors.brightCyan,
        brightWhite: themeColors.brightWhite,
      },
      fontFamily: settings.font_family,
      fontSize: settings.font_size,
      lineHeight: settings.line_height,
      cursorBlink: settings.cursor_blink,
      cursorStyle: settings.cursor_style,
    };
  }, [settings]);

  // ============================================================================
  // INPUT HANDLING
  // ============================================================================

  const handleTerminalData = (terminal: Terminal, data: string) => {
    const code = data.charCodeAt(0);

    // Enter key
    if (code === 13) {
      terminal.write('\r\n');
      if (currentInput.trim()) {
        executeCommand(terminal, currentInput.trim());
        setCommandHistory((prev) => [...prev, currentInput.trim()]);
        setHistoryIndex(-1);
      } else {
        writePrompt(terminal);
      }
      setCurrentInput('');
      return;
    }

    // Backspace
    if (code === 127) {
      if (currentInput.length > 0) {
        setCurrentInput((prev) => prev.slice(0, -1));
        terminal.write('\b \b');
      }
      return;
    }

    // Ctrl+C
    if (code === 3) {
      terminal.write('^C\r\n');
      writePrompt(terminal);
      setCurrentInput('');
      return;
    }

    // Ctrl+L (clear)
    if (code === 12) {
      terminal.clear();
      writePrompt(terminal);
      setCurrentInput('');
      return;
    }

    // Arrow Up (history)
    if (data === '\x1b[A') {
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        const command = commandHistory[newIndex];
        // Clear current line
        terminal.write('\r\x1b[K');
        writePrompt(terminal);
        terminal.write(command);
        setCurrentInput(command);
      }
      return;
    }

    // Arrow Down (history)
    if (data === '\x1b[B') {
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          terminal.write('\r\x1b[K');
          writePrompt(terminal);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          const command = commandHistory[newIndex];
          terminal.write('\r\x1b[K');
          writePrompt(terminal);
          terminal.write(command);
          setCurrentInput(command);
        }
      }
      return;
    }

    // Tab (autocomplete)
    if (code === 9) {
      const commonCommands = ['ls', 'cd', 'pwd', 'cat', 'echo', 'grep', 'find', 'mkdir', 'rm', 'cp', 'mv', 'clear', 'exit', 'help'];
      const input = currentInput.toLowerCase();
      
      if (input.length > 0) {
        const matches = commonCommands.filter(cmd => cmd.startsWith(input));
        if (matches.length === 1) {
          const completion = matches[0].slice(input.length);
          setCurrentInput(matches[0]);
          terminal.write(completion);
        } else if (matches.length > 1) {
          terminal.write('\r\n' + matches.join('  ') + '\r\n');
          writePrompt(terminal);
          terminal.write(currentInput);
        }
      }
      return;
    }

    // Printable characters
    if (code >= 32 && code < 127) {
      setCurrentInput((prev) => prev + data);
      terminal.write(data);
    }
  };

  const executeCommand = async (terminal: Terminal, command: string) => {
    try {
      const output = await onCommand(command);
      if (output) {
        terminal.write(output + '\r\n');
      }
      writePrompt(terminal);
    } catch (err) {
      terminal.write(`\x1b[31mError: ${err instanceof Error ? err.message : 'Unknown error'}\x1b[0m\r\n`);
      writePrompt(terminal);
    }
  };

  const writePrompt = (terminal: Terminal) => {
    const cwd = session.cwd.replace(process.env.HOME || '', '~');
    terminal.write(`\x1b[32m${session.shell}\x1b[0m:\x1b[34m${cwd}\x1b[0m$ `);
  };

  // ============================================================================
  // TERMINAL ACTIONS
  // ============================================================================

  const handleClear = () => {
    xtermRef.current?.clear();
    writePrompt(xtermRef.current!);
    setCurrentInput('');
  };

  const handleCopy = () => {
    const selection = xtermRef.current?.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (xtermRef.current) {
        xtermRef.current.paste(text);
        setCurrentInput((prev) => prev + text);
      }
    } catch (err) {
      log.error('Failed to paste:', err);
    }
  };

  const handleFind = () => {
    const searchTerm = prompt('Search in terminal:');
    if (searchTerm && xtermRef.current) {
      // Search in terminal buffer
      const buffer = xtermRef.current.buffer.active;
      let found = false;
      let foundLine = -1;
      
      for (let i = 0; i < buffer.length; i++) {
        const line = buffer.getLine(i)?.translateToString();
        if (line?.toLowerCase().includes(searchTerm.toLowerCase())) {
          foundLine = i;
          found = true;
          break;
        }
      }
      
      if (found && foundLine >= 0) {
        xtermRef.current.scrollToLine(foundLine);
        // Visual feedback
        xtermRef.current.write(`\r\n\x1b[33m[Search] Found "${searchTerm}" at line ${foundLine + 1}\x1b[0m\r\n`);
        writePrompt(xtermRef.current);
      } else {
        xtermRef.current.write(`\r\n\x1b[31m[Search] "${searchTerm}" not found\x1b[0m\r\n`);
        writePrompt(xtermRef.current);
      }
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`terminal-pane ${pane.is_active ? 'active' : ''}`}
      onClick={onFocus}
      ref={(el) => { 
        if (el) {
          el.style.setProperty('--pane-width', String(pane.size.width));
          el.style.setProperty('--pane-height', String(pane.size.height));
        }
      }}
    >
      <div className="terminal-pane-header">
        <div className="session-info">
          <span
            className="status-indicator"
            ref={(el) => { if (el) el.style.backgroundColor = getStatusColor(session.status); }}
          ></span>
          <span className="session-title">{session.title}</span>
          <span className="session-shell">{session.shell}</span>
        </div>
        <div className="pane-actions">
          <button
            className="icon-btn"
            onClick={handleClear}
            title="Clear Terminal"
          >
            <span className="icon">🧹</span>
          </button>
          <button
            className="icon-btn"
            onClick={handleCopy}
            title="Copy Selection"
          >
            <span className="icon">📋</span>
          </button>
          <button
            className="icon-btn"
            onClick={handlePaste}
            title="Paste"
          >
            <span className="icon">📝</span>
          </button>
          <button
            className="icon-btn"
            onClick={handleFind}
            title="Find"
          >
            <span className="icon">🔍</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => onSplit('horizontal')}
            title="Split Horizontal"
          >
            <span className="icon">⬍</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => onSplit('vertical')}
            title="Split Vertical"
          >
            <span className="icon">⬌</span>
          </button>
          <button
            className="icon-btn close"
            onClick={onClose}
            title="Close Pane"
          >
            <span className="icon">✕</span>
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="terminal-container"></div>
    </div>
  );
};
