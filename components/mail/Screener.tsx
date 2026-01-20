'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('Screener');

/**
 * CUBE Mail - The Screener
 * 
 * HEY-inspired feature that gives users control over who can
 * reach their inbox. New senders must be approved before their
 * emails appear in the inbox.
 * 
 * Features:
 * - Approve/block new senders
 * - Smart AI suggestions
 * - Domain-level rules
 * - Quick actions
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Check,
  X,
  Building2,
  Clock,
  Mail,
  Sparkles,
  Filter,
  Search,
  MoreHorizontal,
  ChevronRight,
  Inbox,
  Archive,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { mailService, getInitials } from '@/lib/services/mail-service';
import type { 
  Email, 
  ScreenerDecision,
  ScreenerConfig as _ScreenerConfig,
} from '@/lib/types/mail';

import './Screener.css';

// ============================================================================
// TYPES
// ============================================================================

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ScreenerProps {
  accountId: string;
  className?: string;
  onClose?: () => void;
}

/**
 * Represents a sender pending review in the screener
 */
interface PendingSender {
  senderEmail: string;
  senderName?: string;
  avatar?: string;
  domain?: string;
  firstSeen?: Date;
  emailCount?: number;
  emails: Email[];
  latestEmail: Email;
  aiSuggestion?: {
    decision: 'approve' | 'block';
    confidence: number;
    reason: string;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Screener({ accountId, className, onClose }: ScreenerProps) {
  const [pendingSenders, setPendingSenders] = useState<PendingSender[]>([]);
  const [approvedSenders, setApprovedSenders] = useState<string[]>([]);
  const [blockedSenders, setBlockedSenders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSender, setSelectedSender] = useState<PendingSender | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Load screener data
  useEffect(() => {
    async function loadScreenerData() {
      try {
        setIsLoading(true);
        
        const [configData, pendingData] = await Promise.all([
          mailService.getScreenerConfig(accountId),
          mailService.getScreenerPending(accountId),
        ]);
        
        // Group pending emails by sender
        const senderMap = new Map<string, PendingSender>();
        
        // Store approved/blocked from config
        setApprovedSenders(configData.approvedSenders || []);
        setBlockedSenders(configData.blockedSenders || []);
        
        for (const email of pendingData) {
          const senderEmail = email.from.email.toLowerCase();
          const senderName = email.from.name || senderEmail;
          
          if (!senderMap.has(senderEmail)) {
            senderMap.set(senderEmail, {
              senderEmail,
              senderName,
              emailCount: 1,
              firstSeen: email.date,
              latestEmail: email,
              emails: [email],
            });
          } else {
            const existing = senderMap.get(senderEmail)!;
            existing.emailCount = (existing.emailCount || 0) + 1;
            existing.emails.push(email);
            // Update latestEmail if this is newer
            if (new Date(email.date) > new Date(existing.latestEmail.date)) {
              existing.latestEmail = email;
            }
            // Update firstSeen if this is older
            if (existing.firstSeen && new Date(email.date) < new Date(existing.firstSeen)) {
              existing.firstSeen = email.date;
            }
          }
        }
        
        setPendingSenders(Array.from(senderMap.values()));
      } catch (error) {
        log.error('Failed to load screener data:', error);
        setError('Failed to load screener data');
        showToast('error', 'Failed to load screener data');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadScreenerData();
  }, [accountId, showToast]);

  // Handle decision
  const handleDecision = useCallback(async (
    sender: PendingSender,
    decision: 'approve' | 'block'
  ) => {
    try {
      const screenerDecision: ScreenerDecision = {
        senderId: sender.senderEmail,
        senderEmail: sender.senderEmail,
        decision,
        decidedAt: new Date(),
      };
      
      await mailService.screenerDecision(accountId, screenerDecision);
      
      // Update local state
      setPendingSenders(prev => prev.filter(s => s.senderEmail !== sender.senderEmail));
      
      if (decision === 'approve') {
        setApprovedSenders(prev => [...prev, sender.senderEmail]);
      } else {
        setBlockedSenders(prev => [...prev, sender.senderEmail]);
      }
      
      if (selectedSender?.senderEmail === sender.senderEmail) {
        setSelectedSender(null);
      }
      
      showToast('success', decision === 'approve' 
        ? `Approved ${sender.senderName || sender.senderEmail}` 
        : `Blocked ${sender.senderName || sender.senderEmail}`
      );
    } catch (error) {
      log.error('Failed to process decision:', error);
      showToast('error', 'Failed to process decision');
    }
  }, [accountId, selectedSender, showToast]);

  // Bulk actions
  const handleApproveAll = useCallback(async () => {
    for (const sender of pendingSenders) {
      await handleDecision(sender, 'approve');
    }
  }, [pendingSenders, handleDecision]);

  const handleBlockAll = useCallback(async () => {
    for (const sender of pendingSenders) {
      await handleDecision(sender, 'block');
    }
  }, [pendingSenders, handleDecision]);

  // Filter senders
  const filteredPending = pendingSenders.filter(sender =>
    sender.senderEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sender.senderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApproved = approvedSenders.filter(sender =>
    sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBlocked = blockedSenders.filter(sender =>
    sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className={cn('screener screener--loading', className)}>
        <div className="screener__loader">
          <Shield className="h-10 w-10 animate-pulse text-blue-500" />
          <p className="mt-4 text-muted-foreground">Loading The Screener...</p>
        </div>
      </div>
    );
  }

  if (error && pendingSenders.length === 0 && approvedSenders.length === 0 && blockedSenders.length === 0) {
    return (
      <div className={cn('screener screener--error', className)}>
        <div className="screener__loader">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className="mt-4 text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('screener', className)}>
        {/* Toast Notifications */}
        {toasts.length > 0 && (
          <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map(toast => (
              <div
                key={toast.id}
                className={cn(
                  'px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right',
                  toast.type === 'success' && 'bg-green-500 text-white',
                  toast.type === 'error' && 'bg-red-500 text-white',
                  toast.type === 'info' && 'bg-blue-500 text-white'
                )}
              >
                {toast.type === 'success' && <CheckCircle className="h-4 w-4" />}
                {toast.type === 'error' && <AlertTriangle className="h-4 w-4" />}
                {toast.type === 'info' && <Shield className="h-4 w-4" />}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <header className="screener__header">
          <div className="screener__header-title">
            <Shield className="h-6 w-6 text-blue-500" />
            <div>
              <h1>The Screener</h1>
              <p className="text-sm text-muted-foreground">
                Control who reaches your inbox
              </p>
            </div>
          </div>
          
          <div className="screener__header-actions">
            <Button variant="outline" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="screener__stats">
          <StatCard 
            icon={Clock}
            label="Pending"
            value={pendingSenders.length}
            color="yellow"
          />
          <StatCard 
            icon={Check}
            label="Approved"
            value={approvedSenders.length}
            color="green"
          />
          <StatCard 
            icon={X}
            label="Blocked"
            value={blockedSenders.length}
            color="red"
          />
        </div>

        {/* Search & Bulk Actions */}
        <div className="screener__toolbar">
          <div className="screener__search">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search senders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent"
            />
          </div>
          
          {activeTab === 'pending' && pendingSenders.length > 0 && (
            <div className="screener__bulk-actions">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleApproveAll}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBlockAll}
              >
                <X className="h-4 w-4 mr-1" />
                Block All
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="screener__content">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-4">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending
                {pendingSenders.length > 0 && (
                  <Badge variant="secondary">{pendingSenders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <Check className="h-4 w-4" />
                Approved
              </TabsTrigger>
              <TabsTrigger value="blocked" className="gap-2">
                <X className="h-4 w-4" />
                Blocked
              </TabsTrigger>
            </TabsList>

            {/* Pending Tab */}
            <TabsContent value="pending" className="flex-1 overflow-hidden">
              <div className="screener__split-view">
                <div className="screener__sender-list">
                  <ScrollArea className="h-full">
                    {filteredPending.length === 0 ? (
                      <EmptyState
                        icon={Shield}
                        title="All clear!"
                        description="No new senders waiting for your decision."
                      />
                    ) : (
                      filteredPending.map(sender => (
                        <SenderItem
                          key={sender.senderEmail}
                          sender={sender}
                          isSelected={selectedSender?.senderEmail === sender.senderEmail}
                          onClick={() => setSelectedSender(sender)}
                          onApprove={() => handleDecision(sender, 'approve')}
                          onBlock={() => handleDecision(sender, 'block')}
                          showActions
                        />
                      ))
                    )}
                  </ScrollArea>
                </div>

                {selectedSender && (
                  <div className="screener__sender-detail">
                    <SenderDetail
                      sender={selectedSender}
                      onApprove={() => handleDecision(selectedSender, 'approve')}
                      onBlock={() => handleDecision(selectedSender, 'block')}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Approved Tab */}
            <TabsContent value="approved" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-4">
                {filteredApproved.length === 0 ? (
                  <EmptyState
                    icon={Check}
                    title="No approved senders"
                    description="Senders you approve will appear here."
                  />
                ) : (
                  <div className="screener__sender-grid">
                    {filteredApproved.map(sender => (
                      <ApprovedSenderCard
                        key={sender}
                        email={sender}
                        onRemove={() => {
                          setApprovedSenders(prev => 
                            prev.filter(s => s !== sender)
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Blocked Tab */}
            <TabsContent value="blocked" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-4">
                {filteredBlocked.length === 0 ? (
                  <EmptyState
                    icon={X}
                    title="No blocked senders"
                    description="Senders you block will appear here."
                  />
                ) : (
                  <div className="screener__sender-grid">
                    {filteredBlocked.map(sender => (
                      <BlockedSenderCard
                        key={sender}
                        email={sender}
                        onUnblock={() => {
                          setBlockedSenders(prev => 
                            prev.filter(s => s !== sender)
                          );
                          setApprovedSenders(prev => [...prev, sender]);
                        }}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: 'yellow' | 'green' | 'red';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className={cn('screener__stat-card', colorClasses[color])}>
      <Icon className="h-5 w-5" />
      <div className="screener__stat-content">
        <span className="screener__stat-value">{value}</span>
        <span className="screener__stat-label">{label}</span>
      </div>
    </div>
  );
}

interface SenderItemProps {
  sender: PendingSender;
  isSelected?: boolean;
  onClick?: () => void;
  onApprove?: () => void;
  onBlock?: () => void;
  showActions?: boolean;
}

function SenderItem({
  sender,
  isSelected,
  onClick,
  onApprove,
  onBlock,
  showActions,
}: SenderItemProps) {
  return (
    <div
      className={cn(
        'screener__sender-item',
        isSelected && 'screener__sender-item--selected'
      )}
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        {sender.avatar && <AvatarImage src={sender.avatar} />}
        <AvatarFallback>
          {getInitials({ email: sender.senderEmail, name: sender.senderName })}
        </AvatarFallback>
      </Avatar>

      <div className="screener__sender-item-content">
        <div className="screener__sender-item-name">
          {sender.senderName || sender.senderEmail.split('@')[0]}
          {sender.domain && (
            <Badge variant="outline" className="ml-2 text-xs">
              {sender.domain}
            </Badge>
          )}
        </div>
        <div className="screener__sender-item-email">
          {sender.senderEmail}
        </div>
        {sender.firstSeen && (
          <div className="screener__sender-item-meta">
            <Mail className="h-3 w-3" />
            <span>
              {sender.emailCount || 1} email(s) since{' '}
              {new Date(sender.firstSeen).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {sender.aiSuggestion && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'screener__ai-suggestion',
              sender.aiSuggestion.decision === 'approve'
                ? 'screener__ai-suggestion--approve'
                : 'screener__ai-suggestion--block'
            )}>
              <Sparkles className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">
              AI suggests: {sender.aiSuggestion.decision}
            </p>
            <p className="text-xs text-muted-foreground">
              {sender.aiSuggestion.reason}
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      {showActions && (
        <div className="screener__sender-item-actions">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.();
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Approve</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onBlock?.();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Block</TooltipContent>
          </Tooltip>
        </div>
      )}

      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

interface SenderDetailProps {
  sender: PendingSender;
  onApprove: () => void;
  onBlock: () => void;
}

function SenderDetail({ sender, onApprove, onBlock }: SenderDetailProps) {
  return (
    <div className="screener__detail">
      <div className="screener__detail-header">
        <Avatar className="h-16 w-16">
          {sender.avatar && <AvatarImage src={sender.avatar} />}
          <AvatarFallback className="text-xl">
            {getInitials({ email: sender.senderEmail, name: sender.senderName })}
          </AvatarFallback>
        </Avatar>
        
        <div className="screener__detail-info">
          <h3>{sender.senderName || sender.senderEmail.split('@')[0]}</h3>
          <p className="text-muted-foreground">{sender.senderEmail}</p>
          {sender.domain && (
            <Badge variant="outline" className="mt-1">
              <Building2 className="h-3 w-3 mr-1" />
              {sender.domain}
            </Badge>
          )}
        </div>
      </div>

      {sender.aiSuggestion && (
        <Card className="screener__ai-card">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              AI Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className={cn(
              'flex items-center gap-2 text-sm font-medium',
              sender.aiSuggestion.decision === 'approve'
                ? 'text-green-600'
                : 'text-red-600'
            )}>
              {sender.aiSuggestion.decision === 'approve' 
                ? <Check className="h-4 w-4" />
                : <X className="h-4 w-4" />
              }
              {sender.aiSuggestion.decision === 'approve' 
                ? 'Approve this sender'
                : 'Block this sender'
              }
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {sender.aiSuggestion.reason}
            </p>
            <div className="mt-2 flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    'h-full rounded-full',
                    sender.aiSuggestion.decision === 'approve'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${sender.aiSuggestion.confidence}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {sender.aiSuggestion.confidence}% confidence
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="screener__detail-stats">
        <div className="screener__detail-stat">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{sender.emailCount || 1} emails</span>
        </div>
        {sender.firstSeen && (
          <div className="screener__detail-stat">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              First contact: {new Date(sender.firstSeen).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="screener__detail-preview">
        <h4 className="text-sm font-medium mb-2">Preview Emails</h4>
        {sender.emails.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No email preview available
          </p>
        ) : (
          <ScrollArea className="h-48">
            {sender.emails.map(email => (
              <div key={email.id} className="screener__email-preview">
                <div className="screener__email-preview-subject">
                  {email.subject || '(No subject)'}
                </div>
                <div className="screener__email-preview-snippet">
                  {email.snippet}
                </div>
                <div className="screener__email-preview-date">
                  {new Date(email.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
      </div>

      <div className="screener__detail-actions">
        <Button 
          className="flex-1" 
          variant="outline"
          onClick={onBlock}
        >
          <X className="h-4 w-4 mr-2" />
          Block
        </Button>
        <Button 
          className="flex-1"
          onClick={onApprove}
        >
          <Check className="h-4 w-4 mr-2" />
          Approve
        </Button>
      </div>

      <div className="screener__detail-secondary">
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Inbox className="h-4 w-4 mr-2" />
          Approve & move to Inbox
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Archive className="h-4 w-4 mr-2" />
          Approve & archive
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Block & delete all
        </Button>
      </div>
    </div>
  );
}

interface ApprovedSenderCardProps {
  email: string;
  onRemove: () => void;
}

function ApprovedSenderCard({ email, onRemove }: ApprovedSenderCardProps) {
  const displayName = email.split('@')[0];
  
  return (
    <Card className="screener__sender-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {getInitials({ email, name: displayName })}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {displayName}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {email}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Filter className="h-4 w-4 mr-2" />
                Create filter
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={onRemove}
              >
                <X className="h-4 w-4 mr-2" />
                Remove from approved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
            <Check className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface BlockedSenderCardProps {
  email: string;
  onUnblock: () => void;
}

function BlockedSenderCard({ email, onUnblock }: BlockedSenderCardProps) {
  const displayName = email.split('@')[0];
  
  return (
    <Card className="screener__sender-card screener__sender-card--blocked">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 opacity-50">
            <AvatarFallback>
              {getInitials({ email, name: displayName })}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate opacity-75">
              {displayName}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {email}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onUnblock}>
                <Check className="h-4 w-4 mr-2" />
                Unblock sender
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete all emails
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
            <X className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="screener__empty">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

export default Screener;
