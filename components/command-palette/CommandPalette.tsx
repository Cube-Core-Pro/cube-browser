/**
 * CUBE Nexum - Command Palette Component
 * 
 * Power user command palette with:
 * - Fuzzy search
 * - Keyboard navigation
 * - Recent commands
 * - Category grouping
 */

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useCommandPalette,
  registerDefaultCommands,
  CATEGORY_CONFIG,
  CommandPaletteService,
} from '@/lib/services/command-palette-service';
import type { Command, CommandCategory } from '@/lib/services/command-palette-service';
import './CommandPalette.css';

// ============================================================================
// ICON COMPONENTS
// ============================================================================

const SearchIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const CommandIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  </svg>
);

const EnterIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 10 4 15 9 20" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
);

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface CommandItemProps {
  command: Command;
  isSelected: boolean;
  onSelect: () => void;
  onExecute: () => void;
}

const CommandItem: React.FC<CommandItemProps> = ({
  command,
  isSelected,
  onSelect,
  onExecute,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <div
      ref={itemRef}
      className={`command-item ${isSelected ? 'selected' : ''}`}
      onMouseEnter={onSelect}
      onClick={onExecute}
      role="option"
      aria-selected={isSelected}
    >
      <div className="command-item-icon">
        {command.icon || CATEGORY_CONFIG[command.category].icon}
      </div>
      <div className="command-item-content">
        <span className="command-item-title">{command.title}</span>
        {command.description && (
          <span className="command-item-description">{command.description}</span>
        )}
      </div>
      {command.shortcut && (
        <div className="command-item-shortcut">
          {CommandPaletteService.formatShortcut(command.shortcut)}
        </div>
      )}
      {command.badge && (
        <span className="command-item-badge">{command.badge}</span>
      )}
    </div>
  );
};

interface CommandGroupProps {
  category: CommandCategory;
  title: string;
  commands: Command[];
  startIndex: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onExecute: (index: number) => void;
}

const CommandGroup: React.FC<CommandGroupProps> = ({
  category,
  title,
  commands,
  startIndex,
  selectedIndex,
  onSelect,
  onExecute,
}) => {
  return (
    <div className="command-group">
      <div className="command-group-header">
        <span className="command-group-icon">{CATEGORY_CONFIG[category].icon}</span>
        <span className="command-group-title">{title}</span>
      </div>
      <div className="command-group-items" role="listbox">
        {commands.map((command, index) => (
          <CommandItem
            key={command.id}
            command={command}
            isSelected={startIndex + index === selectedIndex}
            onSelect={() => onSelect(startIndex + index)}
            onExecute={() => onExecute(startIndex + index)}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    isOpen,
    query,
    setQuery,
    results,
    groupedResults,
    selectedIndex,
    setSelectedIndex,
    close,
    executeSelected,
    moveSelection,
  } = useCommandPalette();

  // Register default commands on mount
  useEffect(() => {
    registerDefaultCommands(router);
  }, [router]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveSelection(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveSelection(-1);
        break;
      case 'Enter':
        e.preventDefault();
        executeSelected();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Tab':
        e.preventDefault();
        moveSelection(e.shiftKey ? -1 : 1);
        break;
    }
  }, [moveSelection, executeSelected, close]);

  const handleExecute = useCallback(async (index: number) => {
    if (results[index]) {
      close();
      await CommandPaletteService.executeCommand(results[index].id);
    }
  }, [results, close]);

  // Calculate start index for each group
  let currentIndex = 0;
  const groupStartIndices = groupedResults.map(group => {
    const start = currentIndex;
    currentIndex += group.commands.length;
    return start;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="command-palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            ref={dialogRef}
            className="command-palette"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            {/* Search Header */}
            <div className="command-palette-header">
              <div className="command-palette-search">
                <SearchIcon />
                <input
                  ref={inputRef}
                  type="text"
                  className="command-palette-input"
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  aria-label="Search commands"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                <div className="command-palette-hint">
                  <span className="hint-key">↑↓</span>
                  <span className="hint-text">navigate</span>
                  <span className="hint-key"><EnterIcon /></span>
                  <span className="hint-text">select</span>
                  <span className="hint-key">esc</span>
                  <span className="hint-text">close</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="command-palette-results">
              {groupedResults.length === 0 ? (
                <div className="command-palette-empty">
                  <span className="empty-icon">🔍</span>
                  <span className="empty-text">No commands found</span>
                  <span className="empty-hint">Try a different search term</span>
                </div>
              ) : (
                groupedResults.map((group, groupIndex) => (
                  <CommandGroup
                    key={group.category}
                    category={group.category}
                    title={group.title}
                    commands={group.commands}
                    startIndex={groupStartIndices[groupIndex]}
                    selectedIndex={selectedIndex}
                    onSelect={setSelectedIndex}
                    onExecute={handleExecute}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="command-palette-footer">
              <div className="footer-left">
                <CommandIcon />
                <span>CUBE Nexum v7.0.0</span>
              </div>
              <div className="footer-right">
                <span className="footer-hint">
                  Press <kbd>⌘</kbd><kbd>K</kbd> to toggle
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
