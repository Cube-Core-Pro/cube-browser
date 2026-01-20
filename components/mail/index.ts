/**
 * CUBE Mail - Component Index
 * 
 * Export all mail-related components for CUBE Mail integration.
 * 
 * This module provides a complete email client with:
 * - Full IMAP/SMTP integration
 * - Multi-account support (Gmail, Outlook, Yahoo, iCloud, custom)
 * - AI-powered email screener (sender approval system)
 * - Rich email composition with formatting
 * - Attachment handling
 * - Thread view and conversation grouping
 * - Label and folder management
 * 
 * @version 1.0.0
 */

// Main Component
export { CubeMail, default as CubeMailDefault } from './CubeMail';

// Feature Components
export { Screener, default as ScreenerDefault } from './Screener';
export { AddAccountModal, default as AddAccountModalDefault } from './AddAccountModal';
export { EmailViewer, default as EmailViewerDefault } from './EmailViewer';
export { ComposeEmail, default as ComposeEmailDefault } from './ComposeEmail';

// Types (re-exported for convenience)
export type {
  Email,
  EmailAddress,
  Attachment,
  MailAccount,
  MailLabel,
  MailFolder,
  EmailCategory,
  ComposeDraft,
  MailSearchQuery,
  MailFilter,
  ScreenerConfig,
  ScreenerDecision,
  MailProvider,
  SyncStatus,
} from '@/lib/types/mail';
