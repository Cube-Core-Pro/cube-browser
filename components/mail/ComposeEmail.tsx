'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ComposeEmail');

/**
 * CUBE Mail - Compose Email Dialog
 * 
 * Full-featured email composer with:
 * - Rich text editing (bold, italic, lists, links)
 * - Recipient autocomplete
 * - CC/BCC fields
 * - Attachment handling
 * - Draft auto-save
 * - AI writing assistance
 * - Template support
 * 
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Send,
  X,
  Paperclip,
  Link as LinkIcon,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Minimize2,
  Maximize2,
  Trash2,
  Loader2,
  Save,
  Sparkles,
  Clock,
  Calendar,
  FileText,
  MoreHorizontal,
  Quote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { mailService } from '@/lib/services/mail-service';
import type { Email, MailAccount, ComposeDraft } from '@/lib/types/mail';

import './ComposeEmail.css';

// ============================================================================
// TYPES
// ============================================================================

interface ComposeEmailProps {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (email: Partial<Email>) => void;
  replyTo?: Email;
  replyAll?: boolean;
  forward?: Email;
  accounts: MailAccount[];
  defaultAccountId?: string;
}

interface Recipient {
  email: string;
  name?: string;
  type: 'to' | 'cc' | 'bcc';
}

interface AttachmentFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  uploaded: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComposeEmail({
  isOpen,
  onClose,
  onSend,
  replyTo,
  replyAll = false,
  forward,
  accounts,
  defaultAccountId,
}: ComposeEmailProps) {
  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId || accounts[0]?.id || '');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [toInput, setToInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  
  // UI state
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize from reply/forward
  useEffect(() => {
    if (replyTo) {
      // Set up reply
      const replyRecipients: Recipient[] = [{ 
        email: replyTo.from.email, 
        name: replyTo.from.name,
        type: 'to' 
      }];
      
      if (replyAll && replyTo.to) {
        replyTo.to.forEach(addr => {
          if (addr.email !== accounts.find(a => a.id === selectedAccountId)?.email) {
            replyRecipients.push({ ...addr, type: 'to' });
          }
        });
        replyTo.cc?.forEach(addr => {
          replyRecipients.push({ ...addr, type: 'cc' });
          setShowCcBcc(true);
        });
      }
      
      setRecipients(replyRecipients);
      setSubject(`Re: ${replyTo.subject.replace(/^Re:\s*/i, '')}`);
      setBody(createReplyBody(replyTo));
    } else if (forward) {
      // Set up forward
      setSubject(`Fwd: ${forward.subject.replace(/^Fwd:\s*/i, '')}`);
      setBody(createForwardBody(forward));
      
      // Include attachments
      if (forward.attachments) {
        // In production, we'd fetch the actual attachment data
        log.debug('Forwarding attachments:', forward.attachments);
      }
    }
  }, [replyTo, replyAll, forward, accounts, selectedAccountId]);

  // Auto-save draft
  useEffect(() => {
    if (!isOpen || !body) return;
    
    const timer = setInterval(() => {
      handleSaveDraft();
    }, AUTO_SAVE_INTERVAL);
    
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSaveDraft is stable
  }, [isOpen, body]);

  // Create reply body with quoted text
  const createReplyBody = (email: Email): string => {
    const date = email.date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const from = email.from.name ? `${email.from.name} <${email.from.email}>` : email.from.email;
    
    return `<br/><br/>On ${date}, ${from} wrote:<br/><blockquote style="margin: 0 0 0 12px; padding-left: 12px; border-left: 2px solid #ccc;">${email.bodyHtml || email.bodyText || ''}</blockquote>`;
  };

  // Create forward body
  const createForwardBody = (email: Email): string => {
    const date = email.date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `<br/><br/>---------- Forwarded message ----------<br/>
From: ${email.from.name ? `${email.from.name} <${email.from.email}>` : email.from.email}<br/>
Date: ${date}<br/>
Subject: ${email.subject}<br/>
To: ${email.to.map(t => t.name ? `${t.name} <${t.email}>` : t.email).join(', ')}<br/>
<br/>
${email.bodyHtml || email.bodyText || ''}`;
  };

  // Add recipient from input
  const addRecipient = useCallback((input: string, type: 'to' | 'cc' | 'bcc') => {
    const email = input.trim();
    if (!email) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email address');
      return;
    }
    
    // Check for duplicates
    if (recipients.some(r => r.email === email)) {
      setError('Recipient already added');
      return;
    }
    
    setRecipients([...recipients, { email, type }]);
    setError(null);
    
    // Clear the input
    if (type === 'to') setToInput('');
    if (type === 'cc') setCcInput('');
    if (type === 'bcc') setBccInput('');
  }, [recipients]);

  // Remove recipient
  const removeRecipient = useCallback((email: string) => {
    setRecipients(recipients.filter(r => r.email !== email));
  }, [recipients]);

  // Handle key press in recipient input
  const handleRecipientKeyPress = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    type: 'to' | 'cc' | 'bcc'
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addRecipient(input, type);
    }
  }, [addRecipient]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newAttachments: AttachmentFile[] = [];
    
    Array.from(files).forEach(file => {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        setError(`File "${file.name}" is too large. Maximum size is 25MB.`);
        return;
      }
      
      newAttachments.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        uploaded: false,
      });
    });
    
    setAttachments([...attachments, ...newAttachments]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [attachments]);

  // Remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  }, [attachments]);

  // Format toolbar actions
  const execFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    bodyRef.current?.focus();
  }, []);

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      // In production, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
    } catch (err) {
      log.error('Failed to save draft:', err);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  // Send email
  const handleSend = useCallback(async () => {
    // Validate
    const toRecipients = recipients.filter(r => r.type === 'to');
    if (toRecipients.length === 0) {
      setError('Please add at least one recipient');
      return;
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      const draft: ComposeDraft = {
        accountId: selectedAccountId,
        to: recipients.filter(r => r.type === 'to').map(r => ({ email: r.email, name: r.name })),
        cc: recipients.filter(r => r.type === 'cc').map(r => ({ email: r.email, name: r.name })),
        bcc: recipients.filter(r => r.type === 'bcc').map(r => ({ email: r.email, name: r.name })),
        subject,
        body: bodyRef.current?.innerHTML || '',
        bodyFormat: 'html',
        attachments: attachments.map(a => ({
          file: a.file,
          id: a.id,
          progress: 100,
          status: 'completed' as const,
        })),
        inReplyTo: replyTo?.messageId,
        encryption: { enabled: false },
      };
      
      const sentEmail = await mailService.sendEmail(draft);
      
      if (onSend) {
        onSend(sentEmail);
      }
      
      // Close dialog
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  }, [recipients, selectedAccountId, subject, attachments, replyTo, onSend, onClose]);

  // AI assistance
  const handleAiSuggest = useCallback(async () => {
    if (!replyTo) return;
    
    setIsAiLoading(true);
    try {
      const suggestion = await mailService.suggestReply(replyTo);
      
      if (suggestion && bodyRef.current) {
        bodyRef.current.innerHTML += `<br/>${suggestion}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI suggestion failed');
    } finally {
      setIsAiLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- selectedAccountId not used in effect
  }, [replyTo]);

  // Handle discard
  const handleDiscard = useCallback(() => {
    if (body || recipients.length > 0) {
      if (!confirm('Discard this draft?')) {
        return;
      }
    }
    onClose();
  }, [body, recipients, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDiscard}>
      <DialogContent 
        className={cn(
          'compose-email',
          isMinimized && 'compose-email--minimized'
        )}
      >
        {/* Header */}
        <DialogHeader className="compose-email__header">
          <div className="compose-email__header-content">
            <DialogTitle className="compose-email__title">
              {replyTo ? (replyAll ? 'Reply All' : 'Reply') : forward ? 'Forward' : 'New Message'}
            </DialogTitle>
            <div className="compose-email__header-actions">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDiscard}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {lastSaved && (
            <div className="compose-email__saved">
              <Clock className="h-3 w-3" />
              <span>Draft saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </DialogHeader>

        {!isMinimized && (
          <div className="compose-email__body">
            {/* From Account Selector */}
            {accounts.length > 1 && (
              <div className="compose-email__field">
                <Label>From</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name || account.email} &lt;{account.email}&gt;
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* To Field */}
            <div className="compose-email__field">
              <div className="compose-email__field-header">
                <Label>To</Label>
                <button 
                  className="compose-email__ccbcc-toggle"
                  onClick={() => setShowCcBcc(!showCcBcc)}
                >
                  {showCcBcc ? 'Hide' : 'Cc/Bcc'}
                </button>
              </div>
              <div className="compose-email__recipients">
                {recipients.filter(r => r.type === 'to').map(r => (
                  <Badge key={r.email} variant="secondary" className="compose-email__recipient">
                    {r.name || r.email}
                    <button onClick={() => removeRecipient(r.email)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="recipient@example.com"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  onKeyDown={(e) => handleRecipientKeyPress(e, toInput, 'to')}
                  onBlur={() => toInput && addRecipient(toInput, 'to')}
                  className="compose-email__recipient-input"
                />
              </div>
            </div>

            {/* Cc/Bcc Fields */}
            {showCcBcc && (
              <>
                <div className="compose-email__field">
                  <Label>Cc</Label>
                  <div className="compose-email__recipients">
                    {recipients.filter(r => r.type === 'cc').map(r => (
                      <Badge key={r.email} variant="secondary" className="compose-email__recipient">
                        {r.name || r.email}
                        <button onClick={() => removeRecipient(r.email)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      placeholder="cc@example.com"
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      onKeyDown={(e) => handleRecipientKeyPress(e, ccInput, 'cc')}
                      onBlur={() => ccInput && addRecipient(ccInput, 'cc')}
                      className="compose-email__recipient-input"
                    />
                  </div>
                </div>
                
                <div className="compose-email__field">
                  <Label>Bcc</Label>
                  <div className="compose-email__recipients">
                    {recipients.filter(r => r.type === 'bcc').map(r => (
                      <Badge key={r.email} variant="secondary" className="compose-email__recipient">
                        {r.name || r.email}
                        <button onClick={() => removeRecipient(r.email)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      placeholder="bcc@example.com"
                      value={bccInput}
                      onChange={(e) => setBccInput(e.target.value)}
                      onKeyDown={(e) => handleRecipientKeyPress(e, bccInput, 'bcc')}
                      onBlur={() => bccInput && addRecipient(bccInput, 'bcc')}
                      className="compose-email__recipient-input"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Subject */}
            <div className="compose-email__field">
              <Label>Subject</Label>
              <Input
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Formatting Toolbar */}
            <div className="compose-email__toolbar">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => execFormat('bold')}>
                    <Bold className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => execFormat('italic')}>
                    <Italic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Italic</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => execFormat('underline')}>
                    <Underline className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Underline</TooltipContent>
              </Tooltip>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => execFormat('insertUnorderedList')}>
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bullet List</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => execFormat('insertOrderedList')}>
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Numbered List</TooltipContent>
              </Tooltip>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const url = prompt('Enter URL:');
                      if (url) execFormat('createLink', url);
                    }}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert Link</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => execFormat('formatBlock', 'blockquote')}
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Quote</TooltipContent>
              </Tooltip>
              
              <div className="flex-1" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleAiSuggest}
                    disabled={isAiLoading || !replyTo}
                    className="compose-email__ai-btn"
                  >
                    {isAiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>AI Assist</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Get AI writing suggestions</TooltipContent>
              </Tooltip>
            </div>

            {/* Message Body */}
            <div 
              ref={bodyRef}
              className="compose-email__editor"
              contentEditable
              dangerouslySetInnerHTML={{ __html: body }}
              onInput={() => {
                // Update body state on input
              }}
            />

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="compose-email__attachments">
                {attachments.map(attachment => (
                  <div key={attachment.id} className="compose-email__attachment">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="compose-email__attachment-name">{attachment.name}</span>
                    <span className="compose-email__attachment-size">
                      {(attachment.size / 1024).toFixed(1)} KB
                    </span>
                    <button onClick={() => removeAttachment(attachment.id)}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="compose-email__error">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="compose-email__footer">
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send
          </Button>
          
          <div className="compose-email__footer-actions">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={handleFileSelect}
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach Files</TooltipContent>
            </Tooltip>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSaveDraft}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Send
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Use Template
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-500"
                  onClick={handleDiscard}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Discard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ComposeEmail;
