/**
 * Collaboration Service - Team Workspaces & Real-time Collaboration
 *
 * Enterprise-grade collaboration features including team workspaces,
 * real-time editing, version control, and commenting.
 *
 * M5 Features:
 * - Team workspaces
 * - Real-time collaboration
 * - Version control
 * - Comments & annotations
 * - Activity feed
 * - Presence awareness
 * - Role-based access control
 * - Sharing & permissions
 *
 * @module CollaborationService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService } from './telemetry-service';

// ============================================================================
// Workspace Types
// ============================================================================

export interface Workspace {
  /**
   * Workspace ID
   */
  id: string;

  /**
   * Workspace name
   */
  name: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Workspace type
   */
  type: WorkspaceType;

  /**
   * Owner
   */
  ownerId: string;

  /**
   * Organization ID
   */
  organizationId?: string;

  /**
   * Members
   */
  members: WorkspaceMember[];

  /**
   * Settings
   */
  settings: WorkspaceSettings;

  /**
   * Avatar URL
   */
  avatarUrl?: string;

  /**
   * Is archived
   */
  isArchived: boolean;

  /**
   * Statistics
   */
  stats: WorkspaceStats;

  /**
   * Creation time
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;

  /**
   * Last activity
   */
  lastActivityAt: number;

  /**
   * Tags
   */
  tags: string[];
}

export type WorkspaceType =
  | 'personal'
  | 'team'
  | 'project'
  | 'organization';

export interface WorkspaceMember {
  /**
   * User ID
   */
  userId: string;

  /**
   * User name
   */
  name: string;

  /**
   * User email
   */
  email: string;

  /**
   * Avatar URL
   */
  avatarUrl?: string;

  /**
   * Role
   */
  role: WorkspaceRole;

  /**
   * Permissions
   */
  permissions: Permission[];

  /**
   * Join date
   */
  joinedAt: number;

  /**
   * Last active
   */
  lastActiveAt?: number;

  /**
   * Is online
   */
  isOnline: boolean;
}

export type WorkspaceRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'viewer'
  | 'guest';

export type Permission =
  | 'read'
  | 'write'
  | 'delete'
  | 'share'
  | 'manage-members'
  | 'manage-settings'
  | 'export'
  | 'admin';

export interface WorkspaceSettings {
  /**
   * Is public
   */
  isPublic: boolean;

  /**
   * Allow guest access
   */
  allowGuestAccess: boolean;

  /**
   * Guest permissions
   */
  guestPermissions: Permission[];

  /**
   * Require approval for join
   */
  requireApproval: boolean;

  /**
   * Default role for new members
   */
  defaultRole: WorkspaceRole;

  /**
   * Version control enabled
   */
  versionControlEnabled: boolean;

  /**
   * Auto-save interval (ms)
   */
  autoSaveInterval: number;

  /**
   * Activity tracking
   */
  activityTracking: boolean;

  /**
   * Notifications
   */
  notifications: {
    onMemberJoin: boolean;
    onMemberLeave: boolean;
    onResourceChange: boolean;
    onComment: boolean;
    onMention: boolean;
  };
}

export interface WorkspaceStats {
  memberCount: number;
  resourceCount: number;
  totalVersions: number;
  totalComments: number;
  lastWeekActivity: number;
}

// ============================================================================
// Resource Types
// ============================================================================

export interface CollaborativeResource {
  /**
   * Resource ID
   */
  id: string;

  /**
   * Workspace ID
   */
  workspaceId: string;

  /**
   * Resource name
   */
  name: string;

  /**
   * Resource type
   */
  type: ResourceType;

  /**
   * Content
   */
  content: unknown;

  /**
   * Current version
   */
  version: number;

  /**
   * Version history
   */
  versions: ResourceVersion[];

  /**
   * Creator
   */
  createdBy: string;

  /**
   * Last editor
   */
  lastEditedBy: string;

  /**
   * Is locked
   */
  isLocked: boolean;

  /**
   * Locked by
   */
  lockedBy?: string;

  /**
   * Lock expires at
   */
  lockExpiresAt?: number;

  /**
   * Comments
   */
  commentCount: number;

  /**
   * Tags
   */
  tags: string[];

  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;

  /**
   * Creation time
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;
}

export type ResourceType =
  | 'workflow'
  | 'automation'
  | 'template'
  | 'data-source'
  | 'schema'
  | 'document'
  | 'script'
  | 'config'
  | 'dashboard'
  | 'report'
  | 'custom';

export interface ResourceVersion {
  /**
   * Version number
   */
  version: number;

  /**
   * Content
   */
  content: unknown;

  /**
   * Changed by
   */
  changedBy: string;

  /**
   * Change description
   */
  changeDescription?: string;

  /**
   * Diff from previous
   */
  diff?: ResourceDiff;

  /**
   * Is published
   */
  isPublished: boolean;

  /**
   * Timestamp
   */
  timestamp: number;
}

export interface ResourceDiff {
  additions: number;
  deletions: number;
  changes: DiffChange[];
}

export interface DiffChange {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: unknown;
  newValue?: unknown;
}

// ============================================================================
// Comment Types
// ============================================================================

export interface Comment {
  /**
   * Comment ID
   */
  id: string;

  /**
   * Resource ID
   */
  resourceId: string;

  /**
   * Parent comment ID (for replies)
   */
  parentId?: string;

  /**
   * Author ID
   */
  authorId: string;

  /**
   * Author name
   */
  authorName: string;

  /**
   * Author avatar
   */
  authorAvatar?: string;

  /**
   * Content
   */
  content: string;

  /**
   * Mentions
   */
  mentions: string[];

  /**
   * Attachments
   */
  attachments?: CommentAttachment[];

  /**
   * Position (for inline comments)
   */
  position?: CommentPosition;

  /**
   * Is resolved
   */
  isResolved: boolean;

  /**
   * Resolved by
   */
  resolvedBy?: string;

  /**
   * Resolved at
   */
  resolvedAt?: number;

  /**
   * Is edited
   */
  isEdited: boolean;

  /**
   * Reactions
   */
  reactions: CommentReaction[];

  /**
   * Reply count
   */
  replyCount: number;

  /**
   * Creation time
   */
  createdAt: number;

  /**
   * Last update
   */
  updatedAt: number;
}

export interface CommentAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface CommentPosition {
  /**
   * Path in resource
   */
  path?: string;

  /**
   * Line number
   */
  line?: number;

  /**
   * Column
   */
  column?: number;

  /**
   * Selection start
   */
  selectionStart?: number;

  /**
   * Selection end
   */
  selectionEnd?: number;
}

export interface CommentReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

// ============================================================================
// Activity Types
// ============================================================================

export interface Activity {
  /**
   * Activity ID
   */
  id: string;

  /**
   * Workspace ID
   */
  workspaceId: string;

  /**
   * Resource ID
   */
  resourceId?: string;

  /**
   * Activity type
   */
  type: ActivityType;

  /**
   * Actor ID
   */
  actorId: string;

  /**
   * Actor name
   */
  actorName: string;

  /**
   * Actor avatar
   */
  actorAvatar?: string;

  /**
   * Description
   */
  description: string;

  /**
   * Details
   */
  details?: Record<string, unknown>;

  /**
   * Timestamp
   */
  timestamp: number;
}

export type ActivityType =
  | 'resource.created'
  | 'resource.updated'
  | 'resource.deleted'
  | 'resource.shared'
  | 'resource.locked'
  | 'resource.unlocked'
  | 'version.created'
  | 'version.restored'
  | 'comment.added'
  | 'comment.resolved'
  | 'member.joined'
  | 'member.left'
  | 'member.role-changed'
  | 'workspace.settings-changed'
  | 'workspace.archived'
  | 'workspace.restored';

// ============================================================================
// Presence Types
// ============================================================================

export interface UserPresence {
  /**
   * User ID
   */
  userId: string;

  /**
   * User name
   */
  name: string;

  /**
   * Avatar
   */
  avatarUrl?: string;

  /**
   * Status
   */
  status: PresenceStatus;

  /**
   * Current resource
   */
  currentResourceId?: string;

  /**
   * Cursor position
   */
  cursor?: CursorPosition;

  /**
   * Selection
   */
  selection?: SelectionRange;

  /**
   * Color
   */
  color: string;

  /**
   * Last seen
   */
  lastSeen: number;
}

export type PresenceStatus =
  | 'online'
  | 'editing'
  | 'viewing'
  | 'away'
  | 'offline';

export interface CursorPosition {
  path: string;
  line: number;
  column: number;
}

export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
}

// ============================================================================
// Session Types (Real-time Collaboration)
// ============================================================================

export interface CollaborationSession {
  id: string;
  name: string;
  host_id: string;
  participants: SessionParticipant[];
  created_at: string;
  is_screen_sharing: boolean;
  is_voice_active: boolean;
  is_video_active: boolean;
  shared_workflow_id?: string;
  permissions: SessionPermissions;
}

export interface SessionParticipant {
  id: string;
  name: string;
  avatar_url?: string;
  cursor_position?: SessionCursorPosition;
  is_host: boolean;
  is_speaker: boolean;
  is_screen_sharing: boolean;
  joined_at: string;
  last_activity: string;
  permissions: ParticipantPermissions;
}

export interface SessionCursorPosition {
  x: number;
  y: number;
  viewport_id: string;
  color: string;
}

export interface SessionPermissions {
  allow_screen_control: boolean;
  allow_workflow_editing: boolean;
  allow_browser_control: boolean;
  allow_file_sharing: boolean;
  allow_recording: boolean;
  require_approval_for_actions: boolean;
}

export interface ParticipantPermissions {
  can_control_screen: boolean;
  can_edit_workflow: boolean;
  can_speak: boolean;
  can_share_screen: boolean;
  can_control_browser: boolean;
}

export interface CollaborativeEdit {
  edit_id: string;
  session_id: string;
  user_id: string;
  timestamp: string;
  edit_type: string;
  data: unknown;
  is_synced: boolean;
}

export interface SessionChatMessage {
  message_id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  content: string;
  timestamp: string;
}

// ============================================================================
// Share Types
// ============================================================================

export interface ShareLink {
  /**
   * Share ID
   */
  id: string;

  /**
   * Resource ID
   */
  resourceId: string;

  /**
   * Link URL
   */
  url: string;

  /**
   * Permissions
   */
  permissions: Permission[];

  /**
   * Password protected
   */
  isPasswordProtected: boolean;

  /**
   * Password (hashed)
   */
  password?: string;

  /**
   * Expires at
   */
  expiresAt?: number;

  /**
   * Access count
   */
  accessCount: number;

  /**
   * Max accesses
   */
  maxAccesses?: number;

  /**
   * Allowed emails
   */
  allowedEmails?: string[];

  /**
   * Created by
   */
  createdBy: string;

  /**
   * Creation time
   */
  createdAt: number;
}

export interface ShareInvitation {
  /**
   * Invitation ID
   */
  id: string;

  /**
   * Workspace ID
   */
  workspaceId: string;

  /**
   * Invitee email
   */
  email: string;

  /**
   * Role
   */
  role: WorkspaceRole;

  /**
   * Invited by
   */
  invitedBy: string;

  /**
   * Status
   */
  status: 'pending' | 'accepted' | 'declined' | 'expired';

  /**
   * Expires at
   */
  expiresAt: number;

  /**
   * Message
   */
  message?: string;

  /**
   * Creation time
   */
  createdAt: number;
}

// ============================================================================
// Workspace Service
// ============================================================================

export const WorkspaceService = {
  /**
   * Create workspace
   */
  create: async (
    workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt' | 'lastActivityAt' | 'stats'>
  ): Promise<Workspace> => {
    TelemetryService.trackEvent('workspace_created', { type: workspace.type });

    return invoke<Workspace>('workspace_create', { workspace });
  },

  /**
   * Get all workspaces
   */
  getAll: async (filters?: {
    type?: WorkspaceType;
    isArchived?: boolean;
  }): Promise<Workspace[]> => {
    return invoke<Workspace[]>('workspace_get_all', { filters });
  },

  /**
   * Get workspace by ID
   */
  get: async (workspaceId: string): Promise<Workspace | null> => {
    return invoke<Workspace | null>('workspace_get', { workspaceId });
  },

  /**
   * Update workspace
   */
  update: async (
    workspaceId: string,
    updates: Partial<Workspace>
  ): Promise<Workspace> => {
    return invoke<Workspace>('workspace_update', { workspaceId, updates });
  },

  /**
   * Delete workspace
   */
  delete: async (workspaceId: string): Promise<void> => {
    return invoke('workspace_delete', { workspaceId });
  },

  /**
   * Archive workspace
   */
  archive: async (workspaceId: string): Promise<void> => {
    return invoke('workspace_archive', { workspaceId });
  },

  /**
   * Restore workspace
   */
  restore: async (workspaceId: string): Promise<void> => {
    return invoke('workspace_restore', { workspaceId });
  },

  /**
   * Update settings
   */
  updateSettings: async (
    workspaceId: string,
    settings: Partial<WorkspaceSettings>
  ): Promise<WorkspaceSettings> => {
    return invoke<WorkspaceSettings>('workspace_update_settings', {
      workspaceId,
      settings,
    });
  },

  /**
   * Transfer ownership
   */
  transferOwnership: async (
    workspaceId: string,
    newOwnerId: string
  ): Promise<void> => {
    return invoke('workspace_transfer_ownership', { workspaceId, newOwnerId });
  },

  /**
   * Duplicate workspace
   */
  duplicate: async (
    workspaceId: string,
    newName: string
  ): Promise<Workspace> => {
    return invoke<Workspace>('workspace_duplicate', { workspaceId, newName });
  },
};

// ============================================================================
// Member Service
// ============================================================================

export const MemberService = {
  /**
   * Add member
   */
  add: async (
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember> => {
    return invoke<WorkspaceMember>('member_add', { workspaceId, userId, role });
  },

  /**
   * Remove member
   */
  remove: async (workspaceId: string, userId: string): Promise<void> => {
    return invoke('member_remove', { workspaceId, userId });
  },

  /**
   * Update role
   */
  updateRole: async (
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMember> => {
    return invoke<WorkspaceMember>('member_update_role', {
      workspaceId,
      userId,
      role,
    });
  },

  /**
   * Update permissions
   */
  updatePermissions: async (
    workspaceId: string,
    userId: string,
    permissions: Permission[]
  ): Promise<WorkspaceMember> => {
    return invoke<WorkspaceMember>('member_update_permissions', {
      workspaceId,
      userId,
      permissions,
    });
  },

  /**
   * Get members
   */
  getAll: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    return invoke<WorkspaceMember[]>('member_get_all', { workspaceId });
  },

  /**
   * Get member
   */
  get: async (
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMember | null> => {
    return invoke<WorkspaceMember | null>('member_get', { workspaceId, userId });
  },

  /**
   * Search users to invite
   */
  searchUsers: async (
    query: string
  ): Promise<{ id: string; name: string; email: string; avatarUrl?: string }[]> => {
    return invoke('member_search_users', { query });
  },
};

// ============================================================================
// Invitation Service
// ============================================================================

export const InvitationService = {
  /**
   * Send invitation
   */
  send: async (
    workspaceId: string,
    email: string,
    role: WorkspaceRole,
    message?: string
  ): Promise<ShareInvitation> => {
    return invoke<ShareInvitation>('invitation_send', {
      workspaceId,
      email,
      role,
      message,
    });
  },

  /**
   * Get pending invitations
   */
  getPending: async (workspaceId: string): Promise<ShareInvitation[]> => {
    return invoke<ShareInvitation[]>('invitation_get_pending', { workspaceId });
  },

  /**
   * Cancel invitation
   */
  cancel: async (invitationId: string): Promise<void> => {
    return invoke('invitation_cancel', { invitationId });
  },

  /**
   * Accept invitation
   */
  accept: async (invitationId: string): Promise<Workspace> => {
    return invoke<Workspace>('invitation_accept', { invitationId });
  },

  /**
   * Decline invitation
   */
  decline: async (invitationId: string): Promise<void> => {
    return invoke('invitation_decline', { invitationId });
  },

  /**
   * Resend invitation
   */
  resend: async (invitationId: string): Promise<ShareInvitation> => {
    return invoke<ShareInvitation>('invitation_resend', { invitationId });
  },

  /**
   * Get my invitations
   */
  getMyInvitations: async (): Promise<ShareInvitation[]> => {
    return invoke<ShareInvitation[]>('invitation_get_mine');
  },
};

// ============================================================================
// Resource Service
// ============================================================================

export const CollaborativeResourceService = {
  /**
   * Create resource
   */
  create: async (
    resource: Omit<
      CollaborativeResource,
      'id' | 'version' | 'versions' | 'createdAt' | 'updatedAt' | 'commentCount' | 'isLocked'
    >
  ): Promise<CollaborativeResource> => {
    return invoke<CollaborativeResource>('collab_resource_create', { resource });
  },

  /**
   * Get all resources
   */
  getAll: async (
    workspaceId: string,
    filters?: {
      type?: ResourceType;
      tags?: string[];
    }
  ): Promise<CollaborativeResource[]> => {
    return invoke<CollaborativeResource[]>('collab_resource_get_all', {
      workspaceId,
      filters,
    });
  },

  /**
   * Get resource by ID
   */
  get: async (resourceId: string): Promise<CollaborativeResource | null> => {
    return invoke<CollaborativeResource | null>('collab_resource_get', {
      resourceId,
    });
  },

  /**
   * Update resource
   */
  update: async (
    resourceId: string,
    content: unknown,
    changeDescription?: string
  ): Promise<CollaborativeResource> => {
    return invoke<CollaborativeResource>('collab_resource_update', {
      resourceId,
      content,
      changeDescription,
    });
  },

  /**
   * Delete resource
   */
  delete: async (resourceId: string): Promise<void> => {
    return invoke('collab_resource_delete', { resourceId });
  },

  /**
   * Lock resource
   */
  lock: async (
    resourceId: string,
    duration?: number
  ): Promise<{ lockedUntil: number }> => {
    return invoke('collab_resource_lock', { resourceId, duration });
  },

  /**
   * Unlock resource
   */
  unlock: async (resourceId: string): Promise<void> => {
    return invoke('collab_resource_unlock', { resourceId });
  },

  /**
   * Move resource
   */
  move: async (
    resourceId: string,
    targetWorkspaceId: string
  ): Promise<CollaborativeResource> => {
    return invoke<CollaborativeResource>('collab_resource_move', {
      resourceId,
      targetWorkspaceId,
    });
  },

  /**
   * Duplicate resource
   */
  duplicate: async (
    resourceId: string,
    newName: string
  ): Promise<CollaborativeResource> => {
    return invoke<CollaborativeResource>('collab_resource_duplicate', {
      resourceId,
      newName,
    });
  },
};

// ============================================================================
// Version Service
// ============================================================================

export const VersionService = {
  /**
   * Get versions
   */
  getAll: async (resourceId: string): Promise<ResourceVersion[]> => {
    return invoke<ResourceVersion[]>('version_get_all', { resourceId });
  },

  /**
   * Get version
   */
  get: async (
    resourceId: string,
    version: number
  ): Promise<ResourceVersion | null> => {
    return invoke<ResourceVersion | null>('version_get', {
      resourceId,
      version,
    });
  },

  /**
   * Restore version
   */
  restore: async (
    resourceId: string,
    version: number
  ): Promise<CollaborativeResource> => {
    return invoke<CollaborativeResource>('version_restore', {
      resourceId,
      version,
    });
  },

  /**
   * Compare versions
   */
  compare: async (
    resourceId: string,
    version1: number,
    version2: number
  ): Promise<ResourceDiff> => {
    return invoke<ResourceDiff>('version_compare', {
      resourceId,
      version1,
      version2,
    });
  },

  /**
   * Publish version
   */
  publish: async (
    resourceId: string,
    version: number
  ): Promise<ResourceVersion> => {
    return invoke<ResourceVersion>('version_publish', {
      resourceId,
      version,
    });
  },

  /**
   * Get published version
   */
  getPublished: async (
    resourceId: string
  ): Promise<ResourceVersion | null> => {
    return invoke<ResourceVersion | null>('version_get_published', {
      resourceId,
    });
  },
};

// ============================================================================
// Comment Service
// ============================================================================

export const CommentService = {
  /**
   * Add comment
   */
  add: async (
    comment: Omit<
      Comment,
      | 'id'
      | 'authorId'
      | 'authorName'
      | 'authorAvatar'
      | 'isResolved'
      | 'isEdited'
      | 'reactions'
      | 'replyCount'
      | 'createdAt'
      | 'updatedAt'
    >
  ): Promise<Comment> => {
    return invoke<Comment>('comment_add', { comment });
  },

  /**
   * Get comments
   */
  getAll: async (
    resourceId: string,
    options?: {
      includeResolved?: boolean;
      position?: CommentPosition;
    }
  ): Promise<Comment[]> => {
    return invoke<Comment[]>('comment_get_all', { resourceId, options });
  },

  /**
   * Get comment
   */
  get: async (commentId: string): Promise<Comment | null> => {
    return invoke<Comment | null>('comment_get', { commentId });
  },

  /**
   * Update comment
   */
  update: async (
    commentId: string,
    content: string
  ): Promise<Comment> => {
    return invoke<Comment>('comment_update', { commentId, content });
  },

  /**
   * Delete comment
   */
  delete: async (commentId: string): Promise<void> => {
    return invoke('comment_delete', { commentId });
  },

  /**
   * Resolve comment
   */
  resolve: async (commentId: string): Promise<Comment> => {
    return invoke<Comment>('comment_resolve', { commentId });
  },

  /**
   * Unresolve comment
   */
  unresolve: async (commentId: string): Promise<Comment> => {
    return invoke<Comment>('comment_unresolve', { commentId });
  },

  /**
   * Add reaction
   */
  addReaction: async (
    commentId: string,
    emoji: string
  ): Promise<Comment> => {
    return invoke<Comment>('comment_add_reaction', { commentId, emoji });
  },

  /**
   * Remove reaction
   */
  removeReaction: async (
    commentId: string,
    emoji: string
  ): Promise<Comment> => {
    return invoke<Comment>('comment_remove_reaction', { commentId, emoji });
  },

  /**
   * Get replies
   */
  getReplies: async (commentId: string): Promise<Comment[]> => {
    return invoke<Comment[]>('comment_get_replies', { commentId });
  },
};

// ============================================================================
// Activity Service
// ============================================================================

export const ActivityService = {
  /**
   * Get activities
   */
  getAll: async (
    workspaceId: string,
    options?: {
      resourceId?: string;
      actorId?: string;
      types?: ActivityType[];
      startDate?: number;
      endDate?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ activities: Activity[]; total: number }> => {
    return invoke('activity_get_all', { workspaceId, options });
  },

  /**
   * Get recent
   */
  getRecent: async (
    workspaceId: string,
    limit?: number
  ): Promise<Activity[]> => {
    return invoke<Activity[]>('activity_get_recent', { workspaceId, limit });
  },

  /**
   * Get resource activity
   */
  getForResource: async (
    resourceId: string,
    limit?: number
  ): Promise<Activity[]> => {
    return invoke<Activity[]>('activity_get_for_resource', {
      resourceId,
      limit,
    });
  },

  /**
   * Subscribe to activities (returns unsubscribe function)
   */
  subscribe: async (
    workspaceId: string,
    _callback: (activity: Activity) => void
  ): Promise<() => void> => {
    const unlistenFn = await invoke<() => void>('activity_subscribe', {
      workspaceId,
    });

    return unlistenFn;
  },
};

// ============================================================================
// Presence Service
// ============================================================================

export const PresenceService = {
  /**
   * Get online users
   */
  getOnline: async (workspaceId: string): Promise<UserPresence[]> => {
    return invoke<UserPresence[]>('presence_get_online', { workspaceId });
  },

  /**
   * Get users in resource
   */
  getInResource: async (resourceId: string): Promise<UserPresence[]> => {
    return invoke<UserPresence[]>('presence_get_in_resource', { resourceId });
  },

  /**
   * Update presence
   */
  update: async (presence: {
    status?: PresenceStatus;
    currentResourceId?: string;
    cursor?: CursorPosition;
    selection?: SelectionRange;
  }): Promise<void> => {
    return invoke('presence_update', { presence });
  },

  /**
   * Join resource
   */
  joinResource: async (resourceId: string): Promise<void> => {
    return invoke('presence_join_resource', { resourceId });
  },

  /**
   * Leave resource
   */
  leaveResource: async (resourceId: string): Promise<void> => {
    return invoke('presence_leave_resource', { resourceId });
  },

  /**
   * Subscribe to presence updates
   */
  subscribe: async (
    resourceId: string,
    _callback: (presences: UserPresence[]) => void
  ): Promise<() => void> => {
    const unlistenFn = await invoke<() => void>('presence_subscribe', {
      resourceId,
    });

    return unlistenFn;
  },

  /**
   * Set away
   */
  setAway: async (): Promise<void> => {
    return invoke('presence_set_away');
  },

  /**
   * Set online
   */
  setOnline: async (): Promise<void> => {
    return invoke('presence_set_online');
  },
};

// ============================================================================
// Share Service
// ============================================================================

export const ShareService = {
  /**
   * Create share link
   */
  createLink: async (
    resourceId: string,
    options?: {
      permissions?: Permission[];
      password?: string;
      expiresAt?: number;
      maxAccesses?: number;
      allowedEmails?: string[];
    }
  ): Promise<ShareLink> => {
    return invoke<ShareLink>('share_create_link', { resourceId, options });
  },

  /**
   * Get share links
   */
  getLinks: async (resourceId: string): Promise<ShareLink[]> => {
    return invoke<ShareLink[]>('share_get_links', { resourceId });
  },

  /**
   * Update share link
   */
  updateLink: async (
    shareId: string,
    updates: Partial<ShareLink>
  ): Promise<ShareLink> => {
    return invoke<ShareLink>('share_update_link', { shareId, updates });
  },

  /**
   * Delete share link
   */
  deleteLink: async (shareId: string): Promise<void> => {
    return invoke('share_delete_link', { shareId });
  },

  /**
   * Access shared resource
   */
  accessShared: async (
    shareId: string,
    password?: string
  ): Promise<CollaborativeResource> => {
    return invoke<CollaborativeResource>('share_access', { shareId, password });
  },

  /**
   * Share with user
   */
  shareWithUser: async (
    resourceId: string,
    userId: string,
    permissions: Permission[]
  ): Promise<void> => {
    return invoke('share_with_user', { resourceId, userId, permissions });
  },

  /**
   * Unshare with user
   */
  unshareWithUser: async (
    resourceId: string,
    userId: string
  ): Promise<void> => {
    return invoke('share_unshare_user', { resourceId, userId });
  },

  /**
   * Get shared with me
   */
  getSharedWithMe: async (): Promise<CollaborativeResource[]> => {
    return invoke<CollaborativeResource[]>('share_get_shared_with_me');
  },
};

// ============================================================================
// Real-time Service
// ============================================================================

export const RealTimeService = {
  /**
   * Connect to real-time server
   */
  connect: async (workspaceId: string): Promise<void> => {
    return invoke('realtime_connect', { workspaceId });
  },

  /**
   * Disconnect
   */
  disconnect: async (): Promise<void> => {
    return invoke('realtime_disconnect');
  },

  /**
   * Get connection status
   */
  getStatus: async (): Promise<{
    connected: boolean;
    latency?: number;
    reconnectAttempts?: number;
  }> => {
    return invoke('realtime_get_status');
  },

  /**
   * Subscribe to resource changes
   */
  subscribeToResource: async (
    resourceId: string,
    _callback: (change: {
      type: 'update' | 'delete' | 'lock' | 'unlock';
      data: unknown;
    }) => void
  ): Promise<() => void> => {
    const unlistenFn = await invoke<() => void>('realtime_subscribe_resource', {
      resourceId,
    });

    return unlistenFn;
  },

  /**
   * Apply operational transform
   */
  applyOperation: async (
    resourceId: string,
    operation: {
      type: 'insert' | 'delete' | 'replace';
      path: string;
      value?: unknown;
      position?: number;
    }
  ): Promise<void> => {
    return invoke('realtime_apply_operation', { resourceId, operation });
  },
};

// ============================================================================
// Session Service (Real-time Collaboration Sessions)
// ============================================================================

export const SessionService = {
  /**
   * Create a new collaboration session
   */
  create: async (
    name: string,
    hostName: string,
    permissions: SessionPermissions
  ): Promise<CollaborationSession> => {
    return invoke<CollaborationSession>('create_collaboration_session', {
      name,
      host_name: hostName,
      permissions,
    });
  },

  /**
   * Join an existing collaboration session
   */
  join: async (
    sessionId: string,
    participantName: string
  ): Promise<CollaborationSession> => {
    return invoke<CollaborationSession>('join_collaboration_session', {
      session_id: sessionId,
      participant_name: participantName,
    });
  },

  /**
   * Leave a collaboration session
   */
  leave: async (sessionId: string, userId: string): Promise<void> => {
    return invoke('leave_collaboration_session', {
      session_id: sessionId,
      user_id: userId,
    });
  },

  /**
   * Get active sessions
   */
  getActive: async (): Promise<CollaborationSession[]> => {
    return invoke<CollaborationSession[]>('get_active_sessions');
  },

  /**
   * Get session details
   */
  getDetails: async (sessionId: string): Promise<CollaborationSession> => {
    return invoke<CollaborationSession>('get_session_details', {
      session_id: sessionId,
    });
  },

  /**
   * Update cursor position
   */
  updateCursor: async (
    sessionId: string,
    userId: string,
    position: SessionCursorPosition
  ): Promise<void> => {
    return invoke('update_cursor_position', {
      session_id: sessionId,
      user_id: userId,
      position,
    });
  },

  /**
   * Start screen sharing
   */
  startScreenSharing: async (
    sessionId: string,
    userId: string,
    config: {
      quality: string;
      fps: number;
      audio_enabled: boolean;
      cursor_visible: boolean;
      allow_annotations: boolean;
    }
  ): Promise<void> => {
    return invoke('start_screen_sharing', {
      session_id: sessionId,
      user_id: userId,
      config,
    });
  },

  /**
   * Stop screen sharing
   */
  stopScreenSharing: async (
    sessionId: string,
    userId: string
  ): Promise<void> => {
    return invoke('stop_screen_sharing', {
      session_id: sessionId,
      user_id: userId,
    });
  },

  /**
   * Share workflow in session
   */
  shareWorkflow: async (
    sessionId: string,
    workflowId: string
  ): Promise<void> => {
    return invoke('share_workflow_in_session', {
      session_id: sessionId,
      workflow_id: workflowId,
    });
  },

  /**
   * Apply collaborative edit
   */
  applyEdit: async (edit: Omit<CollaborativeEdit, 'edit_id' | 'timestamp' | 'is_synced'>): Promise<CollaborativeEdit> => {
    return invoke<CollaborativeEdit>('apply_collaborative_edit', { edit });
  },

  /**
   * Get session edits
   */
  getEdits: async (sessionId: string): Promise<CollaborativeEdit[]> => {
    return invoke<CollaborativeEdit[]>('get_session_edits', {
      session_id: sessionId,
    });
  },

  /**
   * Send chat message
   */
  sendChat: async (
    sessionId: string,
    userId: string,
    userName: string,
    content: string
  ): Promise<SessionChatMessage> => {
    return invoke<SessionChatMessage>('send_collaboration_chat', {
      session_id: sessionId,
      user_id: userId,
      user_name: userName,
      content,
    });
  },

  /**
   * Start session recording
   */
  startRecording: async (sessionId: string): Promise<void> => {
    return invoke('start_session_recording', { session_id: sessionId });
  },

  /**
   * Stop session recording
   */
  stopRecording: async (sessionId: string): Promise<string> => {
    return invoke<string>('stop_session_recording', { session_id: sessionId });
  },

  /**
   * Grant participant permission
   */
  grantPermission: async (
    sessionId: string,
    participantId: string,
    permission: keyof ParticipantPermissions
  ): Promise<void> => {
    return invoke('grant_participant_permission', {
      session_id: sessionId,
      participant_id: participantId,
      permission,
    });
  },
};

// ============================================================================
// Export
// ============================================================================

export const CollaborationServices = {
  Workspace: WorkspaceService,
  Member: MemberService,
  Invitation: InvitationService,
  Resource: CollaborativeResourceService,
  Version: VersionService,
  Comment: CommentService,
  Activity: ActivityService,
  Presence: PresenceService,
  Share: ShareService,
  RealTime: RealTimeService,
  Session: SessionService,
};

export default CollaborationServices;
