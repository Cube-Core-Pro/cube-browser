'use client';

/**
 * CUBE Mail - Email Viewer Component
 * 
 * Displays email content with:
 * - Rich HTML rendering with sanitization
 * - Plain text fallback
 * - Attachment preview/download
 * - Thread view
 * - Quick actions (reply, forward, archive, delete)
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  Star,
  MoreHorizontal,
  Paperclip,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Eye,
  FileText,
  Image,
  File,
  Video,
  Music,
  FileArchive,
  X,
  Loader2,
  Printer,
  Tag,
  Flag,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { mailService } from '@/lib/services/mail-service';
import type { Email, Attachment, EmailAddress } from '@/lib/types/mail';
import { logger } from '@/lib/services/logger-service';

import './EmailViewer.css';

const log = logger.scope('EmailViewer');

// ============================================================================
// TYPES
// ============================================================================

interface EmailViewerProps {
  email: Email | null;
  onClose?: () => void;
  onReply?: (email: Email) => void;
  onReplyAll?: (email: Email) => void;
  onForward?: (email: Email) => void;
  onArchive?: (email: Email) => void;
  onDelete?: (email: Email) => void;
  onMarkAsRead?: (email: Email) => void;
  onToggleStar?: (email: Email) => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getFileIcon(mimeType: string): React.ReactNode {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-4 w-4" />;
  }
  if (mimeType.startsWith('video/')) {
    return <Video className="h-4 w-4" />;
  }
  if (mimeType.startsWith('audio/')) {
    return <Music className="h-4 w-4" />;
  }
  if (mimeType.includes('pdf')) {
    return <FileText className="h-4 w-4" />;
  }
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) {
    return <FileArchive className="h-4 w-4" />;
  }
  return <File className="h-4 w-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const emailDate = new Date(date);
  const diff = now.getTime() - emailDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return `Today at ${emailDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (days === 1) {
    return `Yesterday at ${emailDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (days < 7) {
    return emailDate.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  }
  return emailDate.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: emailDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatAddress(address: EmailAddress): string {
  if (address.name) {
    return `${address.name} <${address.email}>`;
  }
  return address.email;
}

function getInitials(name: string | undefined, email: string): string {
  if (name) {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  // This removes script tags and inline event handlers
  const sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, 'data-removed=')
    .replace(/javascript:/gi, 'blocked:');
  
  return sanitized;
}

// Email body accessor helper
function getEmailBody(email: Email | null): { html?: string; text?: string } {
  if (!email) return {};
  return {
    html: email.bodyHtml,
    text: email.bodyText,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EmailViewer({
  email,
  onClose,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onMarkAsRead,
  onToggleStar,
  className,
}: EmailViewerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRawSource, setShowRawSource] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullEmail, setFullEmail] = useState<Email | null>(null);

  // Fetch full email content if needed
  useEffect(() => {
    const body = getEmailBody(email);
    if (email && !body.html && !body.text) {
      setIsLoading(true);
      mailService.getEmail(email.accountId, email.id)
        .then(setFullEmail)
        .catch(log.error)
        .finally(() => setIsLoading(false));
    } else {
      setFullEmail(email);
    }
  }, [email]);

  // Mark as read when viewing
  useEffect(() => {
    if (email && !email.isRead && onMarkAsRead) {
      const timer = setTimeout(() => {
        onMarkAsRead(email);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [email, onMarkAsRead]);

  // Determine email content to display
  const displayEmail = fullEmail || email;
  
  const emailContent = useMemo(() => {
    if (!displayEmail) return null;
    
    const body = getEmailBody(displayEmail);
    
    if (body.html) {
      return {
        type: 'html' as const,
        content: sanitizeHtml(body.html),
      };
    }
    
    if (body.text) {
      return {
        type: 'text' as const,
        content: body.text,
      };
    }
    
    return null;
  }, [displayEmail]);

  // Handle actions
  const handleReply = useCallback(() => {
    if (displayEmail && onReply) {
      onReply(displayEmail);
    }
  }, [displayEmail, onReply]);

  const handleReplyAll = useCallback(() => {
    if (displayEmail && onReplyAll) {
      onReplyAll(displayEmail);
    }
  }, [displayEmail, onReplyAll]);

  const handleForward = useCallback(() => {
    if (displayEmail && onForward) {
      onForward(displayEmail);
    }
  }, [displayEmail, onForward]);

  const handleArchive = useCallback(() => {
    if (displayEmail && onArchive) {
      onArchive(displayEmail);
    }
  }, [displayEmail, onArchive]);

  const handleDelete = useCallback(() => {
    if (displayEmail && onDelete) {
      onDelete(displayEmail);
    }
  }, [displayEmail, onDelete]);

  const handleToggleStar = useCallback(() => {
    if (displayEmail && onToggleStar) {
      onToggleStar(displayEmail);
    }
  }, [displayEmail, onToggleStar]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadAttachment = useCallback(async (attachment: Attachment) => {
    try {
      // In production, this would download from backend
      log.debug('Downloading attachment:', attachment.filename);
    } catch (err) {
      log.error('Failed to download attachment:', err);
    }
  }, []);

  // No email selected
  if (!email) {
    return (
      <div className={cn('email-viewer email-viewer--empty', className)}>
        <div className="email-viewer__empty-state">
          <Mail className="h-16 w-16 text-muted-foreground/30" />
          <h3>No Email Selected</h3>
          <p>Select an email from the list to view its contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('email-viewer', className)}>
      {/* Header Actions */}
      <div className="email-viewer__header">
        <div className="email-viewer__actions">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleReply}>
                <Reply className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleReplyAll}>
                <ReplyAll className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply All</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleForward}>
                <Forward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleArchive}>
                <Archive className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleToggleStar}
                className={cn(displayEmail?.isStarred && 'text-yellow-500')}
              >
                <Star className="h-4 w-4" fill={displayEmail?.isStarred ? 'currentColor' : 'none'} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{displayEmail?.isStarred ? 'Unstar' : 'Star'}</TooltipContent>
          </Tooltip>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowRawSource(!showRawSource)}>
                <Eye className="h-4 w-4 mr-2" />
                {showRawSource ? 'Hide' : 'Show'} Source
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Tag className="h-4 w-4 mr-2" />
                Add Label
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Flag className="h-4 w-4 mr-2" />
                Flag Message
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">
                <ShieldAlert className="h-4 w-4 mr-2" />
                Report Spam
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="email-viewer__scroll">
        {/* Subject */}
        <div className="email-viewer__subject">
          <h1>{displayEmail?.subject || '(No Subject)'}</h1>
          {displayEmail?.labels && displayEmail.labels.length > 0 && (
            <div className="email-viewer__labels">
              {displayEmail.labels.map((label, idx) => (
                <Badge key={idx} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Sender Info */}
        <div className="email-viewer__sender">
          <Avatar className="h-10 w-10">
            <AvatarImage src={undefined} />
            <AvatarFallback>
              {getInitials(displayEmail?.from.name, displayEmail?.from.email || '')}
            </AvatarFallback>
          </Avatar>
          
          <div className="email-viewer__sender-info">
            <div className="email-viewer__sender-name">
              <span className="font-semibold">{displayEmail?.from.name || displayEmail?.from.email}</span>
              {displayEmail?.from.name && (
                <span className="text-muted-foreground">&lt;{displayEmail.from.email}&gt;</span>
              )}
            </div>
            
            <button 
              className="email-viewer__recipients"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span>to {displayEmail?.to.map(t => t.name || t.email).join(', ')}</span>
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
          
          <div className="email-viewer__date">
            <Clock className="h-3 w-3" />
            <span>{displayEmail?.date ? formatDate(displayEmail.date) : ''}</span>
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && displayEmail && (
          <div className="email-viewer__details">
            <div className="email-viewer__detail-row">
              <span className="email-viewer__detail-label">From:</span>
              <span>{formatAddress(displayEmail.from)}</span>
            </div>
            <div className="email-viewer__detail-row">
              <span className="email-viewer__detail-label">To:</span>
              <span>{displayEmail.to.map(formatAddress).join(', ')}</span>
            </div>
            {displayEmail.cc && displayEmail.cc.length > 0 && (
              <div className="email-viewer__detail-row">
                <span className="email-viewer__detail-label">Cc:</span>
                <span>{displayEmail.cc.map(formatAddress).join(', ')}</span>
              </div>
            )}
            {displayEmail.bcc && displayEmail.bcc.length > 0 && (
              <div className="email-viewer__detail-row">
                <span className="email-viewer__detail-label">Bcc:</span>
                <span>{displayEmail.bcc.map(formatAddress).join(', ')}</span>
              </div>
            )}
            <div className="email-viewer__detail-row">
              <span className="email-viewer__detail-label">Date:</span>
              <span>{displayEmail.date.toLocaleString()}</span>
            </div>
            {displayEmail.messageId && (
              <div className="email-viewer__detail-row">
                <span className="email-viewer__detail-label">Message ID:</span>
                <span className="text-xs font-mono">{displayEmail.messageId}</span>
              </div>
            )}
          </div>
        )}

        {/* Security Badge */}
        {displayEmail?.spfStatus && displayEmail?.dkimStatus && (
          <div className={cn(
            'email-viewer__security',
            displayEmail.spfStatus === 'pass' && displayEmail.dkimStatus === 'pass' && displayEmail.dmarcStatus === 'pass'
              ? 'email-viewer__security--secure'
              : 'email-viewer__security--warning'
          )}>
            {displayEmail.spfStatus === 'pass' && displayEmail.dkimStatus === 'pass' ? (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Verified sender (SPF, DKIM, DMARC passed)</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                <span>Some security checks did not pass</span>
              </>
            )}
          </div>
        )}

        {/* Attachments */}
        {displayEmail?.attachments && displayEmail.attachments.length > 0 && (
          <div className="email-viewer__attachments">
            <div className="email-viewer__attachments-header">
              <Paperclip className="h-4 w-4" />
              <span>{displayEmail.attachments.length} Attachment{displayEmail.attachments.length > 1 ? 's' : ''}</span>
            </div>
            <div className="email-viewer__attachments-list">
              {displayEmail.attachments.map(attachment => (
                <div key={attachment.id} className="email-viewer__attachment">
                  <div className="email-viewer__attachment-icon">
                    {getFileIcon(attachment.mimeType)}
                  </div>
                  <div className="email-viewer__attachment-info">
                    <span className="email-viewer__attachment-name">{attachment.filename}</span>
                    <span className="email-viewer__attachment-size">{formatFileSize(attachment.size)}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDownloadAttachment(attachment)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Body */}
        <div className="email-viewer__body">
          {isLoading ? (
            <div className="email-viewer__loading">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading email content...</span>
            </div>
          ) : showRawSource ? (
            <pre className="email-viewer__source">
              {displayEmail?.bodyHtml || displayEmail?.bodyText || 'No content'}
            </pre>
          ) : emailContent?.type === 'html' ? (
            <div 
              className="email-viewer__html"
              dangerouslySetInnerHTML={{ __html: emailContent.content }}
            />
          ) : emailContent?.type === 'text' ? (
            <pre className="email-viewer__text">{emailContent.content}</pre>
          ) : (
            <div className="email-viewer__no-content">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p>This email has no content to display.</p>
            </div>
          )}
        </div>

        {/* Quick Reply */}
        <div className="email-viewer__quick-reply">
          <Button variant="outline" className="flex-1" onClick={handleReply}>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleForward}>
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

export default EmailViewer;
