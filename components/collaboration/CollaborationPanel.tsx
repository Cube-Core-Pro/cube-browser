/**
 * Collaboration Panel Component
 * 
 * Real-time collaboration UI with presence, cursors, and activity
 * CUBE Nexum v7.0.0
 * 
 * @component CollaborationPanel
 */

'use client';

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('CollaborationPanel');

import React, { useState, useEffect, useCallback, useRef as _useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CollaborationPanel.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CollaborationMember {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  online: boolean;
  activity: 'idle' | 'viewing' | 'editing' | 'typing' | 'away';
  color: string;
  cursor?: { x: number; y: number };
}

export interface CollaborationRoom {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  maxMembers: number;
}

interface CollaborationPanelProps {
  roomId?: string;
  onClose?: () => void;
  compact?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTIVITY_CONFIG = {
  idle: { label: 'Idle', icon: '💤', color: '#64748b' },
  viewing: { label: 'Viewing', icon: '👀', color: '#3b82f6' },
  editing: { label: 'Editing', icon: '✏️', color: '#10b981' },
  typing: { label: 'Typing', icon: '⌨️', color: '#8b5cf6' },
  away: { label: 'Away', icon: '🚶', color: '#f59e0b' }
};

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: '👑', color: '#f59e0b' },
  admin: { label: 'Admin', icon: '⚙️', color: '#8b5cf6' },
  editor: { label: 'Editor', icon: '✏️', color: '#3b82f6' },
  viewer: { label: 'Viewer', icon: '👁️', color: '#64748b' }
};

const MEMBER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

// ============================================================================
// COLLABORATION HOOK (Real Backend Integration)
// ============================================================================

function useCollaboration(roomId?: string) {
  const [members, setMembers] = useState<CollaborationMember[]>([]);
  const [room, setRoom] = useState<CollaborationRoom | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadSessionData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { SessionService } = await import('@/lib/services/collaboration-service');
        const session = await SessionService.getDetails(roomId);
        
        if (!mounted) return;

        // Transform session participants to CollaborationMember format
        const transformedMembers: CollaborationMember[] = session.participants.map((p, index) => ({
          id: p.id,
          userId: p.id,
          username: p.name.toLowerCase().replace(/\s+/g, '_'),
          displayName: p.name,
          avatar: p.avatar_url,
          role: p.is_host ? 'owner' : (p.permissions.can_edit_workflow ? 'editor' : 'viewer'),
          online: true, // All participants in active session are online
          activity: p.is_screen_sharing ? 'editing' : 'viewing',
          color: MEMBER_COLORS[index % MEMBER_COLORS.length],
          cursor: p.cursor_position ? { x: p.cursor_position.x, y: p.cursor_position.y } : undefined,
        }));

        setMembers(transformedMembers);
        setRoom({
          id: session.id,
          name: session.name,
          type: session.shared_workflow_id ? 'workflow' : 'session',
          memberCount: session.participants.length,
          maxMembers: 10,
        });
        setConnected(true);
      } catch (err) {
        log.error('Failed to load collaboration session:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load session');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSessionData();

    return () => {
      mounted = false;
      setConnected(false);
    };
  }, [roomId]);

  const onlineMembers = members.filter(m => m.online);
  const offlineMembers = members.filter(m => !m.online);

  return { members, onlineMembers, offlineMembers, room, connected, loading, error };
}

// ============================================================================
// SUB COMPONENTS
// ============================================================================

interface MemberAvatarProps {
  member: CollaborationMember;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({ member, size = 'md', showStatus = true }) => {
  const sizeClasses = { sm: 'avatar--sm', md: 'avatar--md', lg: 'avatar--lg' };
  
  return (
    <div className={`collab-avatar ${sizeClasses[size]}`} style={{ borderColor: member.color }}>
      {member.avatar ? (
        <img src={member.avatar} alt={member.displayName} />
      ) : (
        <div className="collab-avatar__placeholder" style={{ background: member.color }}>
          {member.displayName.charAt(0).toUpperCase()}
        </div>
      )}
      {showStatus && member.online && (
        <span 
          className="collab-avatar__status"
          style={{ background: ACTIVITY_CONFIG[member.activity].color }}
          title={ACTIVITY_CONFIG[member.activity].label}
        />
      )}
    </div>
  );
};

interface MemberItemProps {
  member: CollaborationMember;
  isCurrentUser?: boolean;
  onAction?: (action: string, memberId: string) => void;
}

const MemberItem: React.FC<MemberItemProps> = ({ member, isCurrentUser, onAction }) => {
  const [showMenu, setShowMenu] = useState(false);
  const roleConfig = ROLE_CONFIG[member.role];
  const activityConfig = ACTIVITY_CONFIG[member.activity];

  return (
    <motion.div 
      className={`collab-member ${!member.online ? 'collab-member--offline' : ''}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <MemberAvatar member={member} />
      
      <div className="collab-member__info">
        <div className="collab-member__name">
          {member.displayName}
          {isCurrentUser && <span className="collab-member__you">(You)</span>}
        </div>
        <div className="collab-member__meta">
          <span className="collab-member__role" style={{ color: roleConfig.color }}>
            {roleConfig.icon} {roleConfig.label}
          </span>
          {member.online && (
            <>
              <span className="collab-member__separator">•</span>
              <span className="collab-member__activity" style={{ color: activityConfig.color }}>
                {activityConfig.icon} {activityConfig.label}
              </span>
            </>
          )}
        </div>
      </div>

      {!isCurrentUser && (
        <div className="collab-member__actions">
          <button 
            className="collab-member__action-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            ⋯
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                className="collab-member__menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <button onClick={() => onAction?.('view-profile', member.id)}>
                  👤 View Profile
                </button>
                <button onClick={() => onAction?.('message', member.id)}>
                  💬 Send Message
                </button>
                <button onClick={() => onAction?.('follow-cursor', member.id)}>
                  🎯 Follow Cursor
                </button>
                <div className="collab-member__menu-divider" />
                <button onClick={() => onAction?.('change-role', member.id)}>
                  ⚙️ Change Role
                </button>
                <button 
                  className="collab-member__menu-danger"
                  onClick={() => onAction?.('remove', member.id)}
                >
                  🚫 Remove
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

interface AvatarStackProps {
  members: CollaborationMember[];
  max?: number;
  onClick?: () => void;
}

const AvatarStack: React.FC<AvatarStackProps> = ({ members, max = 5, onClick }) => {
  const visible = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className="collab-avatar-stack" onClick={onClick}>
      {visible.map((member, index) => (
        <div 
          key={member.id} 
          className="collab-avatar-stack__item"
          style={{ 
            zIndex: visible.length - index,
            borderColor: member.color 
          }}
          title={member.displayName}
        >
          <MemberAvatar member={member} size="sm" showStatus={false} />
        </div>
      ))}
      {remaining > 0 && (
        <div className="collab-avatar-stack__more">
          +{remaining}
        </div>
      )}
    </div>
  );
};

interface CursorOverlayProps {
  members: CollaborationMember[];
  _containerRef: React.RefObject<HTMLElement>;
}

const CursorOverlay: React.FC<CursorOverlayProps> = ({ members, _containerRef }) => {
  const cursors = members.filter(m => m.online && m.cursor && m.userId !== 'user-005');

  return (
    <div className="collab-cursors">
      {cursors.map(member => (
        <motion.div
          key={member.id}
          className="collab-cursor"
          style={{ color: member.color }}
          initial={false}
          animate={{ 
            x: member.cursor!.x, 
            y: member.cursor!.y 
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <svg 
            className="collab-cursor__pointer" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.86a.5.5 0 0 0-.85.35z" />
          </svg>
          <span className="collab-cursor__label" style={{ background: member.color }}>
            {member.displayName}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  roomId = 'demo-room',
  onClose,
  compact = false
}) => {
  const { members, onlineMembers, offlineMembers, room, connected, loading, error } = useCollaboration(roomId);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleAction = useCallback((action: string, memberId: string) => {
    log.debug(`Action: ${action} for member: ${memberId}`);
    // Handle member actions
  }, []);

  const handleCreateInvite = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setInviteLink(`${window.location.origin}/join/${code}`);
    setShowInvite(true);
  }, []);

  const handleCopyLink = useCallback(() => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [inviteLink]);

  if (loading) {
    return (
      <div className={`collab-panel ${compact ? 'collab-panel--compact' : ''}`}>
        <div className="collab-panel__loading">
          <div className="collab-panel__spinner" />
          <p>Connecting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`collab-panel ${compact ? 'collab-panel--compact' : ''}`}>
        <div className="collab-panel__error">
          <div className="collab-panel__error-icon">⚠️</div>
          <h4>Connection Failed</h4>
          <p>{error}</p>
          <button 
            className="collab-panel__retry-btn"
            onClick={() => window.location.reload()}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`collab-panel ${compact ? 'collab-panel--compact' : ''}`}>
      {/* Header */}
      <div className="collab-panel__header">
        <div className="collab-panel__title-row">
          <h3 className="collab-panel__title">
            <span className={`collab-panel__status ${connected ? 'collab-panel__status--connected' : ''}`} />
            {room?.name || 'Collaboration'}
          </h3>
          {onClose && (
            <button className="collab-panel__close" onClick={onClose}>✕</button>
          )}
        </div>
        <div className="collab-panel__subtitle">
          <span className="collab-panel__online-count">
            🟢 {onlineMembers.length} online
          </span>
          <span className="collab-panel__separator">•</span>
          <span className="collab-panel__total-count">
            {members.length}/{room?.maxMembers || 10} members
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="collab-panel__quick-actions">
        <button 
          className="collab-panel__action-btn"
          onClick={handleCreateInvite}
        >
          🔗 Invite
        </button>
        <button className="collab-panel__action-btn">
          💬 Chat
        </button>
        <button className="collab-panel__action-btn">
          📞 Call
        </button>
      </div>

      {/* Online Members */}
      <div className="collab-panel__section">
        <div className="collab-panel__section-header">
          <span className="collab-panel__section-title">Online — {onlineMembers.length}</span>
        </div>
        <div className="collab-panel__members">
          {onlineMembers.map(member => (
            <MemberItem 
              key={member.id} 
              member={member}
              isCurrentUser={member.userId === 'user-005'}
              onAction={handleAction}
            />
          ))}
        </div>
      </div>

      {/* Offline Members */}
      {offlineMembers.length > 0 && (
        <div className="collab-panel__section">
          <div className="collab-panel__section-header">
            <span className="collab-panel__section-title">Offline — {offlineMembers.length}</span>
          </div>
          <div className="collab-panel__members">
            {offlineMembers.map(member => (
              <MemberItem 
                key={member.id} 
                member={member}
                onAction={handleAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div 
            className="collab-invite-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInvite(false)}
          >
            <motion.div 
              className="collab-invite-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="collab-invite-modal__header">
                <h4>Invite Collaborators</h4>
                <button onClick={() => setShowInvite(false)}>✕</button>
              </div>
              <div className="collab-invite-modal__content">
                <p>Share this link to invite others to collaborate:</p>
                <div className="collab-invite-modal__link-box">
                  <input 
                    type="text" 
                    value={inviteLink || ''} 
                    readOnly 
                  />
                  <button onClick={handleCopyLink}>
                    {copiedLink ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div className="collab-invite-modal__options">
                  <label>
                    <span>Role:</span>
                    <select defaultValue="editor">
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label>
                    <span>Expires:</span>
                    <select defaultValue="7d">
                      <option value="1h">1 hour</option>
                      <option value="24h">24 hours</option>
                      <option value="7d">7 days</option>
                      <option value="never">Never</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="collab-invite-modal__footer">
                <button className="collab-invite-modal__share-btn">
                  📧 Email Invite
                </button>
                <button className="collab-invite-modal__share-btn">
                  💬 Slack
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { AvatarStack, MemberAvatar, CursorOverlay };
export default CollaborationPanel;
