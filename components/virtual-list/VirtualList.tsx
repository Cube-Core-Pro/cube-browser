'use client';

/**
 * VirtualList Component
 * CUBE Elite v7 - High-Performance Virtualized Lists
 * 
 * Uses react-window v2 for efficient rendering of large lists
 * (passwords, emails, logs, etc.) with excellent scroll performance.
 * 
 * @updated API compatible with react-window v2
 */

import React, { useCallback, useRef } from 'react';
import { List, RowComponentProps, ListImperativeAPI } from 'react-window';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('VirtualList');

// =============================================================================
// Types
// =============================================================================

export interface VirtualListItem {
  id: string;
  [key: string]: unknown;
}

export interface FixedVirtualListProps<T extends VirtualListItem> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
  onItemsRendered?: (startIndex: number, endIndex: number) => void;
  emptyMessage?: string;
  height?: number;
  width?: number | string;
}

export interface VariableVirtualListProps<T extends VirtualListItem> {
  items: T[];
  getItemHeight: (index: number) => number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
  emptyMessage?: string;
  height?: number;
  width?: number | string;
}

// =============================================================================
// Row Component Wrapper
// =============================================================================

function createRowComponent<T extends VirtualListItem>(
  items: T[],
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode
) {
  const RowComponent = ({ index, style }: RowComponentProps): React.ReactElement => {
    const item = items[index];
    if (!item) {
      return <div style={style} />;
    }
    return <>{renderItem(item, index, style)}</>;
  };
  RowComponent.displayName = 'VirtualListRow';
  return RowComponent;
}

// =============================================================================
// Fixed Size Virtual List
// =============================================================================

export function FixedVirtualList<T extends VirtualListItem>({
  items,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 5,
  onItemsRendered,
  emptyMessage = 'No items to display',
  height = 400,
  width = '100%',
}: FixedVirtualListProps<T>) {
  const listRef = useRef<ListImperativeAPI>(null);

  log.debug(`Rendering FixedVirtualList with ${items.length} items`);

  // Handle items rendered callback
  const handleRowsRendered = useCallback(
    ({ startIndex, stopIndex }: { startIndex: number; stopIndex: number }) => {
      if (onItemsRendered) {
        onItemsRendered(startIndex, stopIndex);
      }
    },
    [onItemsRendered]
  );

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  const RowComponent = createRowComponent(items, renderItem);

  return (
    <div className={cn('virtual-list', className)} style={{ height, width }}>
      <List
        listRef={listRef}
        rowCount={items.length}
        rowHeight={itemHeight}
        overscanCount={overscanCount}
        onRowsRendered={handleRowsRendered}
        rowComponent={RowComponent}
        rowProps={{}}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

// =============================================================================
// Variable Size Virtual List
// =============================================================================

export function VariableVirtualList<T extends VirtualListItem>({
  items,
  getItemHeight,
  renderItem,
  className = '',
  overscanCount = 5,
  emptyMessage = 'No items to display',
  height = 400,
  width = '100%',
}: VariableVirtualListProps<T>) {
  const listRef = useRef<ListImperativeAPI>(null);

  log.debug(`Rendering VariableVirtualList with ${items.length} items`);

  // Empty state
  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  const RowComponent = createRowComponent(items, renderItem);

  return (
    <div className={cn('virtual-list', className)} style={{ height, width }}>
      <List
        listRef={listRef}
        rowCount={items.length}
        rowHeight={getItemHeight}
        overscanCount={overscanCount}
        rowComponent={RowComponent}
        rowProps={{}}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

// =============================================================================
// Specialized Lists
// =============================================================================

// Password List Item
export interface PasswordListItem extends VirtualListItem {
  title: string;
  username: string;
  url?: string;
  lastUsed?: Date;
}

interface PasswordVirtualListProps {
  passwords: PasswordListItem[];
  onSelect: (password: PasswordListItem) => void;
  selectedId?: string;
  className?: string;
  height?: number;
}

export const PasswordVirtualList: React.FC<PasswordVirtualListProps> = ({
  passwords,
  onSelect,
  selectedId,
  className = '',
  height = 400,
}) => {
  const renderPassword = useCallback(
    (password: PasswordListItem, index: number, style: React.CSSProperties) => (
      <div
        key={password.id}
        style={style}
        className={cn(
          'flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border transition-colors',
          selectedId === password.id ? 'bg-primary/10' : 'hover:bg-muted/50'
        )}
        onClick={() => onSelect(password)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(password)}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-semibold text-sm">
            {password.title.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground truncate">{password.title}</div>
          <div className="text-sm text-muted-foreground truncate">{password.username}</div>
        </div>
      </div>
    ),
    [onSelect, selectedId]
  );

  return (
    <FixedVirtualList
      items={passwords}
      itemHeight={72}
      renderItem={renderPassword}
      className={className}
      emptyMessage="No passwords found"
      height={height}
    />
  );
};

// Email List Item
export interface EmailListItem extends VirtualListItem {
  subject: string;
  from: string;
  preview: string;
  date: Date;
  read: boolean;
  starred: boolean;
}

interface EmailVirtualListProps {
  emails: EmailListItem[];
  onSelect: (email: EmailListItem) => void;
  selectedId?: string;
  className?: string;
  height?: number;
}

export const EmailVirtualList: React.FC<EmailVirtualListProps> = ({
  emails,
  onSelect,
  selectedId,
  className = '',
  height = 400,
}) => {
  const renderEmail = useCallback(
    (email: EmailListItem, index: number, style: React.CSSProperties) => (
      <div
        key={email.id}
        style={style}
        className={cn(
          'px-4 py-3 cursor-pointer border-b border-border transition-colors',
          selectedId === email.id ? 'bg-primary/10' : 'hover:bg-muted/50',
          !email.read && 'bg-primary/5'
        )}
        onClick={() => onSelect(email)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(email)}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className={cn('font-medium truncate', !email.read && 'font-semibold')}>
            {email.from}
          </div>
          <div className="text-xs text-muted-foreground flex-shrink-0">
            {email.date.toLocaleDateString()}
          </div>
        </div>
        <div className={cn('text-sm truncate mb-1', !email.read ? 'text-foreground' : 'text-muted-foreground')}>
          {email.subject}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {email.preview}
        </div>
      </div>
    ),
    [onSelect, selectedId]
  );

  return (
    <FixedVirtualList
      items={emails}
      itemHeight={88}
      renderItem={renderEmail}
      className={className}
      emptyMessage="No emails found"
      height={height}
    />
  );
};

// Log Entry Item
export interface LogEntryItem extends VirtualListItem {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source?: string;
}

interface LogVirtualListProps {
  logs: LogEntryItem[];
  className?: string;
  height?: number;
  onSelect?: (log: LogEntryItem) => void;
}

const LOG_LEVEL_COLORS = {
  debug: 'text-gray-500',
  info: 'text-blue-500',
  warn: 'text-yellow-500',
  error: 'text-red-500',
};

export const LogVirtualList: React.FC<LogVirtualListProps> = ({
  logs,
  className = '',
  height = 400,
  onSelect,
}) => {
  const renderLog = useCallback(
    (logEntry: LogEntryItem, index: number, style: React.CSSProperties) => (
      <div
        key={logEntry.id}
        style={style}
        className={cn(
          'px-3 py-1 font-mono text-xs border-b border-border/50 flex items-center gap-2',
          onSelect && 'cursor-pointer hover:bg-muted/50'
        )}
        onClick={() => onSelect?.(logEntry)}
      >
        <span className="text-muted-foreground w-20 flex-shrink-0">
          {logEntry.timestamp.toLocaleTimeString()}
        </span>
        <span className={cn('w-12 flex-shrink-0 uppercase font-semibold', LOG_LEVEL_COLORS[logEntry.level])}>
          {logEntry.level}
        </span>
        {logEntry.source && (
          <span className="text-muted-foreground w-24 flex-shrink-0 truncate">
            [{logEntry.source}]
          </span>
        )}
        <span className="text-foreground truncate flex-1">
          {logEntry.message}
        </span>
      </div>
    ),
    [onSelect]
  );

  return (
    <FixedVirtualList
      items={logs}
      itemHeight={28}
      renderItem={renderLog}
      className={cn('bg-muted/20 rounded', className)}
      emptyMessage="No log entries"
      height={height}
    />
  );
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Scroll to specific item in list
 */
export const scrollToItem = (
  listRef: React.MutableRefObject<ListImperativeAPI | null>,
  index: number,
  align: 'auto' | 'start' | 'center' | 'end' | 'smart' = 'auto'
) => {
  if (listRef.current) {
    listRef.current.scrollToRow({ index, align });
  }
};

// =============================================================================
// Export
// =============================================================================

export default FixedVirtualList;
