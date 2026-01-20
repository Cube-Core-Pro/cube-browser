'use client';

/**
 * CUBE Mail - Main Email Client Component
 * 
 * A modern, feature-rich email client designed to compete with
 * Gmail, Outlook, ProtonMail, and HEY.
 * 
 * Features:
 * - Multi-account support
 * - E2E encryption
 * - Smart categorization (AI)
 * - The Screener (HEY-inspired)
 * - Dark/Light mode
 * - Keyboard shortcuts
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { logger } from '@/lib/services/logger-service';
import { 
  Mail, 
  Inbox,
  Send, 
  FileEdit, 
  Archive, 
  Trash2, 
  Star,
  Tag,
  Search,
  Settings,
  RefreshCw,
  Plus,
  ChevronDown,
  ShieldCheck,
  Filter,
  MoreHorizontal,
  Paperclip,
  Reply,
  ReplyAll,
  Forward,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';

const log = logger.scope('CubeMail');

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  mailService, 
  getInitials,
  formatFileSize,
  isEmailEncrypted,
} from '@/lib/services/mail-service';
import type { 
  Email, 
  MailAccount, 
  MailFolder, 
  MailLabel,
  EmailCategory,
  ComposeDraft,
} from '@/lib/types/mail';
import { AddAccountModal } from './AddAccountModal';

import './CubeMail.css';

// ============================================================================
// TYPES
// ============================================================================

interface CubeMailProps {
  className?: string;
  defaultAccount?: string;
  onClose?: () => void;
}

interface FolderItem {
  id: MailFolder;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SYSTEM_FOLDERS: FolderItem[] = [
  { id: 'inbox', name: 'Inbox', icon: Inbox },
  { id: 'starred', name: 'Starred', icon: Star },
  { id: 'sent', name: 'Sent', icon: Send },
  { id: 'drafts', name: 'Drafts', icon: FileEdit },
  { id: 'archive', name: 'Archive', icon: Archive },
  { id: 'spam', name: 'Spam', icon: AlertCircle },
  { id: 'trash', name: 'Trash', icon: Trash2 },
];

const CATEGORY_COLORS: Record<EmailCategory, string> = {
  important: 'bg-red-500',
  personal: 'bg-blue-500',
  newsletters: 'bg-purple-500',
  receipts: 'bg-green-500',
  notifications: 'bg-yellow-500',
  social: 'bg-pink-500',
  promotions: 'bg-orange-500',
  updates: 'bg-cyan-500',
  forums: 'bg-indigo-500',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CubeMail({ 
  className,
  defaultAccount,
  onClose: _onClose,
}: CubeMailProps) {
  // State
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<MailAccount | null>(null);
  const [activeFolder, setActiveFolder] = useState<MailFolder>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [labels, setLabels] = useState<MailLabel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Email[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'replyAll' | 'forward'>('new');
  const [unreadCounts, _setUnreadCounts] = useState<Record<MailFolder, number>>({} as Record<MailFolder, number>);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  
  // Refs
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const accs = await mailService.getAccounts();
        setAccounts(accs);
        
        if (accs.length > 0) {
          const account = defaultAccount 
            ? accs.find(a => a.id === defaultAccount) || accs[0]
            : accs.find(a => a.isPrimary) || accs[0];
          setActiveAccount(account);
        }
      } catch (error) {
        log.error('Failed to initialize mail:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    init();
  }, [defaultAccount]);

  // Load emails when account or folder changes
  useEffect(() => {
    async function loadEmails() {
      if (!activeAccount) return;
      
      try {
        setIsLoading(true);
        const emailList = await mailService.fetchEmails(
          activeAccount.id,
          activeFolder,
          { limit: 50 }
        );
        setEmails(emailList);
        
        // Load labels
        const labelList = await mailService.getLabels(activeAccount.id);
        setLabels(labelList);
      } catch (error) {
        log.error('Failed to load emails:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadEmails();
  }, [activeAccount, activeFolder]);

  // Sync handler
  const handleSync = useCallback(async () => {
    if (!activeAccount || isSyncing) return;
    
    try {
      setIsSyncing(true);
      await mailService.syncAccount(activeAccount.id);
      
      // Reload emails
      const emailList = await mailService.fetchEmails(
        activeAccount.id,
        activeFolder,
        { limit: 50 }
      );
      setEmails(emailList);
    } catch (error) {
      log.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [activeAccount, activeFolder, isSyncing]);

  // Email actions
  const handleMarkAsRead = useCallback(async (emailIds: string[], isRead: boolean) => {
    if (!activeAccount) return;
    
    try {
      await mailService.markAsRead(activeAccount.id, emailIds, isRead);
      setEmails(prev => prev.map(e => 
        emailIds.includes(e.id) ? { ...e, isRead } : e
      ));
    } catch (error) {
      log.error('Failed to mark as read:', error);
    }
  }, [activeAccount]);

  const handleToggleStar = useCallback(async (emailId: string) => {
    if (!activeAccount) return;
    
    const email = emails.find(e => e.id === emailId);
    if (!email) return;
    
    try {
      await mailService.setStarred(activeAccount.id, [emailId], !email.isStarred);
      setEmails(prev => prev.map(e => 
        e.id === emailId ? { ...e, isStarred: !e.isStarred } : e
      ));
    } catch (error) {
      log.error('Failed to toggle star:', error);
    }
  }, [activeAccount, emails]);

  const handleArchive = useCallback(async (emailIds: string[]) => {
    if (!activeAccount) return;
    
    try {
      for (const id of emailIds) {
        await mailService.archiveEmails(activeAccount.id, [id]);
      }
      setEmails(prev => prev.filter(e => !emailIds.includes(e.id)));
      setSelectedEmail(null);
    } catch (error) {
      log.error('Failed to archive:', error);
    }
  }, [activeAccount]);

  const handleDelete = useCallback(async (emailIds: string[]) => {
    if (!activeAccount) return;
    
    try {
      for (const id of emailIds) {
        await mailService.deleteEmail(activeAccount.id, id, activeFolder === 'trash');
      }
      setEmails(prev => prev.filter(e => !emailIds.includes(e.id)));
      setSelectedEmail(null);
    } catch (error) {
      log.error('Failed to delete:', error);
    }
  }, [activeAccount, activeFolder]);

  // Debounced FTS search
  useEffect(() => {
    if (!activeAccount) return;
    
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // If query is empty, clear search results
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    
    // Debounce search for 300ms
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await mailService.searchFTS(
          activeAccount.id,
          searchQuery,
          { folder: activeFolder, pageSize: 50 }
        );
        setSearchResults(result.emails);
      } catch (error) {
        log.error('FTS search failed, falling back to client-side:', error);
        // Fallback to client-side search if FTS fails
        const query = searchQuery.toLowerCase();
        const filtered = emails.filter(email => 
          email.subject.toLowerCase().includes(query) ||
          email.from.email.toLowerCase().includes(query) ||
          email.from.name?.toLowerCase().includes(query) ||
          email.snippet.toLowerCase().includes(query)
        );
        setSearchResults(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    // Cleanup on unmount
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [activeAccount, searchQuery, activeFolder, emails]);

  // Get displayed emails (search results or regular emails)
  const displayedEmails = useMemo(() => {
    return searchResults !== null ? searchResults : emails;
  }, [searchResults, emails]);

  // Compose handlers
  const handleCompose = useCallback((mode: 'new' | 'reply' | 'replyAll' | 'forward' = 'new') => {
    setComposeMode(mode);
    setShowCompose(true);
  }, []);

  const handleSendEmail = useCallback(async (draft: ComposeDraft) => {
    try {
      await mailService.sendEmail(draft);
      setShowCompose(false);
    } catch (error) {
      log.error('Failed to send email:', error);
      throw error;
    }
  }, []);

  // Loading state
  if (isLoading && accounts.length === 0) {
    return (
      <div className={cn('cube-mail cube-mail--loading', className)}>
        <div className="cube-mail__loader">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-muted-foreground">Loading CUBE Mail...</p>
        </div>
      </div>
    );
  }

  // No accounts state
  if (accounts.length === 0) {
    return (
      <div className={cn('cube-mail cube-mail--empty', className)}>
        <div className="cube-mail__empty-state">
          <Mail className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Welcome to CUBE Mail</h2>
          <p className="text-muted-foreground mb-6">
            Add an email account to get started
          </p>
          <Button onClick={() => setShowAddAccountModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
          <AddAccountModal
            isOpen={showAddAccountModal}
            onClose={() => setShowAddAccountModal(false)}
            onAccountAdded={async (account) => {
              setAccounts(prev => [...prev, account]);
              setActiveAccount(account);
              setShowAddAccountModal(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('cube-mail', className)}>
        {/* Sidebar */}
        <aside className="cube-mail__sidebar">
          {/* Compose Button */}
          <Button 
            className="cube-mail__compose-btn"
            onClick={() => handleCompose('new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>

          {/* Account Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="cube-mail__account-switcher">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback>
                    {activeAccount ? getInitials({ email: activeAccount.email }) : '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{activeAccount?.email || 'Select Account'}</span>
                <ChevronDown className="h-4 w-4 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {accounts.map(account => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => setActiveAccount(account)}
                  className={cn(
                    activeAccount?.id === account.id && 'bg-accent'
                  )}
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback>{getInitials({ email: account.email })}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.email}</p>
                  </div>
                  {account.isPrimary && (
                    <Badge variant="secondary" className="text-xs">Primary</Badge>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowAddAccountModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Manage Accounts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator className="my-2" />

          {/* Folders */}
          <nav className="cube-mail__folders">
            {SYSTEM_FOLDERS.map(folder => {
              const unread = unreadCounts[folder.id] || 0;
              const Icon = folder.icon;
              
              return (
                <button
                  key={folder.id}
                  className={cn(
                    'cube-mail__folder-item',
                    activeFolder === folder.id && 'cube-mail__folder-item--active'
                  )}
                  onClick={() => setActiveFolder(folder.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{folder.name}</span>
                  {unread > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unread > 99 ? '99+' : unread}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          <Separator className="my-2" />

          {/* Labels */}
          <div className="cube-mail__labels">
            <div className="cube-mail__labels-header">
              <span className="text-xs font-medium text-muted-foreground">Labels</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {labels.map(label => (
              <button
                key={label.id}
                className="cube-mail__label-item"
              >
                <div 
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="flex-1 truncate">{label.name}</span>
                {label.unreadCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {label.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Storage Usage */}
          {activeAccount && (
            <div className="cube-mail__storage">
              <div className="cube-mail__storage-bar">
                <div 
                  className="cube-mail__storage-fill"
                  style={{ 
                    width: `${(activeAccount.storageUsed / activeAccount.storageLimit) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(activeAccount.storageUsed)} of{' '}
                {formatFileSize(activeAccount.storageLimit)} used
              </p>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="cube-mail__main">
          {/* Toolbar */}
          <header className="cube-mail__toolbar">
            <div className="cube-mail__search">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cube-mail__search-input"
              />
            </div>

            <div className="cube-mail__toolbar-actions">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={cn(
                      'h-4 w-4',
                      isSyncing && 'animate-spin'
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filters</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </div>
          </header>

          <div className="cube-mail__content">
            {/* Email List */}
            <div className="cube-mail__list">
              <ScrollArea className="h-full">
                {isSearching ? (
                  <div className="cube-mail__list-empty">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : displayedEmails.length === 0 ? (
                  <div className="cube-mail__list-empty">
                    <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No emails match your search' : 'No emails in this folder'}
                    </p>
                  </div>
                ) : (
                  displayedEmails.map(email => (
                    <EmailListItem
                      key={email.id}
                      email={email}
                      isSelected={selectedEmail?.id === email.id}
                      onClick={() => setSelectedEmail(email)}
                      onStar={() => handleToggleStar(email.id)}
                      onMarkRead={() => handleMarkAsRead([email.id], !email.isRead)}
                      onArchive={() => handleArchive([email.id])}
                      onDelete={() => handleDelete([email.id])}
                    />
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Email Viewer */}
            <div className="cube-mail__viewer">
              {selectedEmail ? (
                <EmailViewer
                  email={selectedEmail}
                  onReply={() => handleCompose('reply')}
                  onReplyAll={() => handleCompose('replyAll')}
                  onForward={() => handleCompose('forward')}
                  onArchive={() => handleArchive([selectedEmail.id])}
                  onDelete={() => handleDelete([selectedEmail.id])}
                  onToggleStar={() => handleToggleStar(selectedEmail.id)}
                />
              ) : (
                <div className="cube-mail__viewer-empty">
                  <Mail className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select an email to view
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Compose Modal */}
        {showCompose && (
          <ComposeModal
            mode={composeMode}
            account={activeAccount!}
            replyTo={composeMode !== 'new' && selectedEmail ? selectedEmail : undefined}
            onSend={handleSendEmail}
            onClose={() => setShowCompose(false)}
          />
        )}

        {/* Add Account Modal */}
        <AddAccountModal
          isOpen={showAddAccountModal}
          onClose={() => setShowAddAccountModal(false)}
          onAccountAdded={async (account) => {
            setAccounts(prev => [...prev, account]);
            setActiveAccount(account);
            setShowAddAccountModal(false);
          }}
        />
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
  onStar: () => void;
  onMarkRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

function EmailListItem({
  email,
  isSelected,
  onClick,
  onStar,
  onMarkRead,
  onArchive,
  onDelete,
}: EmailListItemProps) {
  const categoryColor = email.category ? CATEGORY_COLORS[email.category] : null;
  
  return (
    <div
      className={cn(
        'cube-mail__list-item',
        !email.isRead && 'cube-mail__list-item--unread',
        isSelected && 'cube-mail__list-item--selected'
      )}
      onClick={onClick}
    >
      {/* Checkbox & Star */}
      <div className="cube-mail__list-item-check">
        <button
          className={cn(
            'cube-mail__star-btn',
            email.isStarred && 'cube-mail__star-btn--active'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onStar();
          }}
        >
          <Star className="h-4 w-4" />
        </button>
      </div>

      {/* Avatar */}
      <Avatar className="h-8 w-8">
        {email.from.avatar && <AvatarImage src={email.from.avatar} />}
        <AvatarFallback className="text-xs">
          {getInitials(email.from)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="cube-mail__list-item-content">
        <div className="cube-mail__list-item-header">
          <span className={cn(
            'cube-mail__list-item-from',
            !email.isRead && 'font-semibold'
          )}>
            {email.from.name || email.from.email}
          </span>
          <span className="cube-mail__list-item-date">
            {formatRelativeDate(email.date)}
          </span>
        </div>
        <div className={cn(
          'cube-mail__list-item-subject',
          !email.isRead && 'font-medium'
        )}>
          {email.subject || '(No subject)'}
        </div>
        <div className="cube-mail__list-item-snippet">
          {email.snippet}
        </div>
      </div>

      {/* Indicators */}
      <div className="cube-mail__list-item-indicators">
        {email.hasAttachments && (
          <Paperclip className="h-3 w-3 text-muted-foreground" />
        )}
        {isEmailEncrypted(email) && (
          <Lock className="h-3 w-3 text-green-500" />
        )}
        {categoryColor && (
          <div className={cn('h-2 w-2 rounded-full', categoryColor)} />
        )}
      </div>

      {/* Actions */}
      <div className="cube-mail__list-item-actions">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={(e) => { e.stopPropagation(); onArchive(); }}>
              <Archive className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Archive</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={(e) => { e.stopPropagation(); onMarkRead(); }}>
              {email.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{email.isRead ? 'Mark unread' : 'Mark read'}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

interface EmailViewerProps {
  email: Email;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
}

function EmailViewer({
  email,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onToggleStar,
}: EmailViewerProps) {
  return (
    <div className="cube-mail__email-viewer">
      {/* Header */}
      <header className="cube-mail__email-header">
        <div className="cube-mail__email-subject">
          <h2>{email.subject || '(No subject)'}</h2>
          {email.labels.length > 0 && (
            <div className="cube-mail__email-labels">
              {email.labels.map(label => (
                <Badge key={label} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="cube-mail__email-actions">
          <Button variant="ghost" size="icon" onClick={onToggleStar}>
            <Star className={cn(
              'h-4 w-4',
              email.isStarred && 'fill-yellow-400 text-yellow-400'
            )} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onArchive}>
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Tag className="h-4 w-4 mr-2" />
                Add label
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Filter className="h-4 w-4 mr-2" />
                Filter messages like this
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Clock className="h-4 w-4 mr-2" />
                Snooze
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                Report spam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sender Info */}
      <div className="cube-mail__email-sender">
        <Avatar className="h-10 w-10">
          {email.from.avatar && <AvatarImage src={email.from.avatar} />}
          <AvatarFallback>{getInitials(email.from)}</AvatarFallback>
        </Avatar>
        <div className="cube-mail__email-sender-info">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {email.from.name || email.from.email}
            </span>
            {email.from.isVerified && (
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            )}
            {isEmailEncrypted(email) && (
              <Badge variant="outline" className="text-xs text-green-600">
                <Lock className="h-3 w-3 mr-1" />
                Encrypted
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            To: {email.to.map(t => t.name || t.email).join(', ')}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatFullDate(email.date)}
          </span>
        </div>
      </div>

      {/* Security Status */}
      {(email.spfStatus || email.dkimStatus || email.dmarcStatus) && (
        <div className="cube-mail__email-security">
          <SecurityIndicator label="SPF" status={email.spfStatus} />
          <SecurityIndicator label="DKIM" status={email.dkimStatus} />
          <SecurityIndicator label="DMARC" status={email.dmarcStatus} />
        </div>
      )}

      {/* Body */}
      <ScrollArea className="cube-mail__email-body">
        {email.bodyHtml ? (
          <div 
            className="cube-mail__email-html"
            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
          />
        ) : (
          <pre className="cube-mail__email-text">
            {email.bodyText}
          </pre>
        )}
      </ScrollArea>

      {/* Attachments */}
      {email.attachments.length > 0 && (
        <div className="cube-mail__email-attachments">
          <h4 className="text-sm font-medium mb-2">
            Attachments ({email.attachments.length})
          </h4>
          <div className="cube-mail__attachment-list">
            {email.attachments.map(attachment => (
              <div key={attachment.id} className="cube-mail__attachment-item">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{attachment.filename}</span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </span>
                {attachment.encrypted && (
                  <Lock className="h-3 w-3 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply Actions */}
      <footer className="cube-mail__email-footer">
        <Button variant="outline" onClick={onReply}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
        <Button variant="outline" onClick={onReplyAll}>
          <ReplyAll className="h-4 w-4 mr-2" />
          Reply All
        </Button>
        <Button variant="outline" onClick={onForward}>
          <Forward className="h-4 w-4 mr-2" />
          Forward
        </Button>
      </footer>
    </div>
  );
}

interface SecurityIndicatorProps {
  label: string;
  status?: 'pass' | 'fail' | 'neutral' | 'none';
}

function SecurityIndicator({ label, status }: SecurityIndicatorProps) {
  const Icon = status === 'pass' 
    ? CheckCircle 
    : status === 'fail' 
      ? XCircle 
      : AlertCircle;
  
  const color = status === 'pass'
    ? 'text-green-500'
    : status === 'fail'
      ? 'text-red-500'
      : 'text-yellow-500';
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-1 text-xs', color)}>
          <Icon className="h-3 w-3" />
          <span>{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {label}: {status || 'Unknown'}
      </TooltipContent>
    </Tooltip>
  );
}

interface ComposeModalProps {
  mode: 'new' | 'reply' | 'replyAll' | 'forward';
  account: MailAccount;
  replyTo?: Email;
  onSend: (draft: ComposeDraft) => Promise<void>;
  onClose: () => void;
}

function ComposeModal({
  mode,
  account,
  replyTo,
  onSend,
  onClose,
}: ComposeModalProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [enableEncryption, setEnableEncryption] = useState(false);

  // Initialize based on mode
  useEffect(() => {
    if (!replyTo) return;

    if (mode === 'reply') {
      setTo(replyTo.from.email);
      setSubject(`Re: ${replyTo.subject}`);
    } else if (mode === 'replyAll') {
      setTo(replyTo.from.email);
      setCc(replyTo.to.filter(t => t.email !== account.email).map(t => t.email).join(', '));
      setSubject(`Re: ${replyTo.subject}`);
      setShowCcBcc(true);
    } else if (mode === 'forward') {
      setSubject(`Fwd: ${replyTo.subject}`);
      setBody(`\n\n---------- Forwarded message ---------\n${replyTo.bodyText || ''}`);
    }
  }, [mode, replyTo, account]);

  const handleSend = async () => {
    try {
      setIsSending(true);
      
      const draft: ComposeDraft = {
        accountId: account.id,
        to: to.split(',').map(e => ({ email: e.trim() })),
        cc: cc ? cc.split(',').map(e => ({ email: e.trim() })) : [],
        bcc: bcc ? bcc.split(',').map(e => ({ email: e.trim() })) : [],
        subject,
        body,
        bodyFormat: 'html',
        attachments: [],
        encryption: { enabled: enableEncryption },
        inReplyTo: mode !== 'new' && mode !== 'forward' ? replyTo?.messageId : undefined,
      };
      
      await onSend(draft);
      onClose();
    } catch (error) {
      log.error('Failed to send:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="cube-mail__compose-overlay">
      <div className="cube-mail__compose-modal">
        <header className="cube-mail__compose-header">
          <h3>
            {mode === 'new' ? 'New Message' : 
             mode === 'reply' ? 'Reply' :
             mode === 'replyAll' ? 'Reply All' : 'Forward'}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </header>

        <div className="cube-mail__compose-fields">
          <div className="cube-mail__compose-field">
            <label>To:</label>
            <Input 
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Recipients"
            />
            {!showCcBcc && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowCcBcc(true)}
              >
                Cc/Bcc
              </Button>
            )}
          </div>

          {showCcBcc && (
            <>
              <div className="cube-mail__compose-field">
                <label>Cc:</label>
                <Input 
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Cc recipients"
                />
              </div>
              <div className="cube-mail__compose-field">
                <label>Bcc:</label>
                <Input 
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Bcc recipients"
                />
              </div>
            </>
          )}

          <div className="cube-mail__compose-field">
            <label>Subject:</label>
            <Input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />
          </div>
        </div>

        <textarea
          className="cube-mail__compose-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Compose your message..."
        />

        <footer className="cube-mail__compose-footer">
          <div className="cube-mail__compose-options">
            <Button variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setEnableEncryption(!enableEncryption)}
              className={cn(enableEncryption && 'text-green-500')}
            >
              {enableEncryption ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon">
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>

          <div className="cube-mail__compose-actions">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={!to || isSending}
            >
              {isSending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default CubeMail;
