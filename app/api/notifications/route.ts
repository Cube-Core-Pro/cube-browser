import { logger } from '@/lib/services/logger-service';
const log = logger.scope('route');
/**
 * CUBE Elite v7 - Notifications API Route
 * 
 * PostgreSQL-backed notification system supporting multiple channels:
 * - email: Email notifications via SMTP
 * - push: Browser push notifications via Web Push API
 * - sms: SMS notifications via Twilio/similar
 * - in_app: In-app notifications displayed in UI
 * - webhook: Webhook callbacks to external systems
 * 
 * Features:
 * - Multi-channel delivery
 * - Template system with variable substitution
 * - User preferences with quiet hours and digest
 * - Notification queue with retry logic
 * - Push subscription management
 * 
 * Refactored from in-memory storage to PostgreSQL.
 * Original: route.old.ts
 * 
 * @module api/notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database';
import { verifyAuth, AuthenticatedUser } from '@/lib/auth';
import { getRateLimiter } from '@/lib/rate-limiter';
import { logAudit, getCorsHeaders, handleCorsOptions } from '@/lib/api-middleware';

// Rate limiter instance
const rateLimiter = getRateLimiter();

/**
 * Get CORS headers with origin validation for this request
 */
function getValidatedCorsHeaders(request: NextRequest): Record<string, string> {
  return getCorsHeaders(request);
}

/**
 * Check authentication and rate limiting
 * Returns user if authenticated, or error response
 */
async function checkAuthAndRateLimit(request: NextRequest): Promise<{ user: AuthenticatedUser } | { error: NextResponse }> {
  const corsHeaders = getValidatedCorsHeaders(request);
  
  // Rate limiting check
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const rateLimitStatus = rateLimiter.check(clientIp, '/api/notifications');
  
  if (!rateLimitStatus.allowed) {
    return {
      error: NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitStatus.retryAfter || 60
        },
        { status: 429, headers: corsHeaders }
      )
    };
  }

  // Authentication check
  const authResult = await verifyAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    // Allow development mode without auth
    if (process.env.NODE_ENV === 'development' && !request.headers.get('Authorization')) {
      return {
        user: {
          id: 'dev-user',
          email: 'dev@cube.local',
          name: 'Development User',
          role: 'admin' as const,
          organizationId: 'dev-org',
          permissions: ['*']
        }
      };
    }
    
    return {
      error: NextResponse.json(
        { error: 'Authentication required', details: authResult.error },
        { status: 401, headers: corsHeaders }
      )
    };
  }

  return { user: authResult.user };
}

// =============================================================================
// Types
// =============================================================================

type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app' | 'webhook';
type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';
type DigestFrequency = 'none' | 'daily' | 'weekly';
type DeliveryFrequency = 'realtime' | 'hourly' | 'daily';

interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data: Record<string, unknown>;
  actionUrl?: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  readAt?: string;
  sentAt?: string;
  createdAt: string;
}

interface NotificationTemplate {
  id: string;
  organizationId: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ChannelPreference {
  enabled: boolean;
  frequency?: DeliveryFrequency;
}

interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
}

interface DigestSettings {
  enabled: boolean;
  frequency: DigestFrequency;
  time: string;
}

interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  channels: Record<NotificationChannel, ChannelPreference>;
  categories: Record<string, boolean>;
  quietHours?: QuietHours;
  digest?: DigestSettings;
  updatedAt: string;
}

interface QueuedNotification {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  recipientId: string;
  payload: Record<string, unknown>;
  status: QueueStatus;
  attempts: number;
  maxAttempts: number;
  scheduledFor?: string;
  lastAttempt?: string;
  error?: string;
  createdAt: string;
}

interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
}

// =============================================================================
// Database Mappers
// =============================================================================

function mapNotificationFromDB(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    channel: row.channel as NotificationChannel,
    title: row.title as string,
    body: row.body as string,
    data: (row.data as Record<string, unknown>) || {},
    actionUrl: row.action_url as string | undefined,
    status: row.status as NotificationStatus,
    priority: row.priority as NotificationPriority,
    readAt: row.read_at ? new Date(row.read_at as string).toISOString() : undefined,
    sentAt: row.sent_at ? new Date(row.sent_at as string).toISOString() : undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

function mapTemplateFromDB(row: Record<string, unknown>): NotificationTemplate {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    channel: row.channel as NotificationChannel,
    subject: row.subject as string | undefined,
    body: row.body as string,
    variables: (row.variables as string[]) || [],
    isActive: row.is_active as boolean,
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

function mapPreferencesFromDB(row: Record<string, unknown>): NotificationPreferences {
  return {
    userId: row.user_id as string,
    enabled: row.enabled as boolean,
    channels: row.channels as Record<NotificationChannel, ChannelPreference>,
    categories: row.categories as Record<string, boolean>,
    quietHours: row.quiet_hours as QuietHours | undefined,
    digest: row.digest as DigestSettings | undefined,
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

function mapQueueItemFromDB(row: Record<string, unknown>): QueuedNotification {
  return {
    id: row.id as string,
    notificationId: row.notification_id as string,
    channel: row.channel as NotificationChannel,
    recipientId: row.recipient_id as string,
    payload: row.payload as Record<string, unknown>,
    status: row.status as QueueStatus,
    attempts: row.attempts as number,
    maxAttempts: row.max_attempts as number,
    scheduledFor: row.scheduled_for ? new Date(row.scheduled_for as string).toISOString() : undefined,
    lastAttempt: row.last_attempt ? new Date(row.last_attempt as string).toISOString() : undefined,
    error: row.error as string | undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

function mapPushSubscriptionFromDB(row: Record<string, unknown>): PushSubscription {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    endpoint: row.endpoint as string,
    keys: row.keys as { p256dh: string; auth: string },
    userAgent: row.user_agent as string | undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Render a template by replacing {{variable}} placeholders with values
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Check if current time is within quiet hours
 */
function isWithinQuietHours(quietHours: QuietHours | undefined): boolean {
  if (!quietHours || !quietHours.enabled) {
    return false;
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  const [startHour, startMinute] = quietHours.start.split(':').map(Number);
  const [endHour, endMinute] = quietHours.end.split(':').map(Number);
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    return currentTime >= startTime || currentTime < endTime;
  }
}

/**
 * Queue a notification for delivery
 */
async function queueNotificationForDelivery(
  notificationId: string,
  channel: NotificationChannel,
  recipientId: string,
  payload: Record<string, unknown>,
  scheduledFor?: string
): Promise<QueuedNotification> {
  const result = await db.queryOne<Record<string, unknown>>(
    `INSERT INTO notification_queue (notification_id, channel, recipient_id, payload, scheduled_for)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [notificationId, channel, recipientId, JSON.stringify(payload), scheduledFor]
  );
  
  if (!result) {
    throw new Error('Failed to queue notification');
  }
  
  return mapQueueItemFromDB(result);
}

/**
 * Simulate sending a notification (placeholder for actual delivery)
 */
async function deliverNotification(
  notification: Notification,
  channel: NotificationChannel,
  _recipientId: string
): Promise<{ success: boolean; error?: string }> {
  // Get service configuration from environment
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.cubeai.tools';
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
  
  // Deliver based on channel
  switch (channel) {
    case 'email':
      // Email delivery via server API (avoids nodemailer in edge runtime)
      try {
        const response = await fetch(`${API_BASE}/api/send-email`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.API_SECRET_KEY || ''}`,
          },
          body: JSON.stringify({
            to: notification.userId, // Assumes userId is email for email channel
            subject: notification.title,
            html: notification.body,
            text: notification.body.replace(/<[^>]*>/g, ''),
          }),
        });
        if (response.ok) {
          log.debug(`[EMAIL] ✅ Sent to ${notification.userId}: ${notification.title}`);
          return { success: true };
        }
        const err = await response.json().catch(() => ({ message: 'Unknown error' }));
        log.error('[EMAIL] Failed:', err);
        return { success: false, error: `Email failed: ${err.message || 'Unknown error'}` };
      } catch (error) {
        log.error('[EMAIL] Failed:', error);
        return { success: false, error: `Email failed: ${error}` };
      }
      
    case 'push':
      // Web Push notifications
      log.debug(`[PUSH] Sending to ${notification.userId}: ${notification.title}`);
      // Push notifications handled by service worker registration
      return { success: true };
      
    case 'sms':
      // SMS via Twilio
      if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM) {
        try {
          const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: notification.userId,
              From: TWILIO_FROM,
              Body: notification.body,
            }),
          });
          if (response.ok) {
            log.debug(`[SMS] ✅ Sent to ${notification.userId}`);
            return { success: true };
          }
          const err = await response.json();
          return { success: false, error: `SMS failed: ${err.message}` };
        } catch (error) {
          log.error('[SMS] Failed:', error);
          return { success: false, error: `SMS failed: ${error}` };
        }
      }
      log.debug(`[SMS] (Mock) Would send to ${notification.userId}: ${notification.body}`);
      return { success: true };
      
    case 'in_app':
      // In-app notifications are stored and retrieved by the client
      log.debug(`[IN_APP] Stored for ${notification.userId}: ${notification.title}`);
      return { success: true };
      
    case 'webhook':
      // Webhook delivery
      const webhookUrl = notification.data?.webhookUrl;
      if (webhookUrl && typeof webhookUrl === 'string') {
        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'notification',
              userId: notification.userId,
              title: notification.title,
              body: notification.body,
              data: notification.data,
              timestamp: new Date().toISOString(),
            }),
          });
          if (response.ok) {
            log.debug(`[WEBHOOK] ✅ Delivered to ${webhookUrl}`);
            return { success: true };
          }
          return { success: false, error: `Webhook failed: ${response.status}` };
        } catch (error) {
          log.error('[WEBHOOK] Failed:', error);
          return { success: false, error: `Webhook failed: ${error}` };
        }
      }
      log.debug(`[WEBHOOK] (Mock) Triggering for ${notification.userId}`);
      return { success: true };
      
    default:
      return { success: false, error: `Unknown channel: ${channel}` };
  }
}

/**
 * Get default preferences for a new user
 */
function getDefaultPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    enabled: true,
    channels: {
      email: { enabled: true, frequency: 'realtime' },
      push: { enabled: true, frequency: 'realtime' },
      sms: { enabled: false },
      in_app: { enabled: true, frequency: 'realtime' },
      webhook: { enabled: false },
    },
    categories: {
      security: true,
      marketing: false,
      updates: true,
      workflows: true,
      reports: true,
    },
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    digest: { enabled: false, frequency: 'none', time: '09:00' },
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// GET Handler
// =============================================================================

export async function GET(request: NextRequest) {
  // Check authentication and rate limiting
  const authCheck = await checkAuthAndRateLimit(request);
  if ('error' in authCheck) {
    return authCheck.error;
  }
  const _user = authCheck.user;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  
  try {
    switch (action) {
      // -------------------------------------------------------------------------
      // List Notifications
      // -------------------------------------------------------------------------
      case 'list': {
        const userId = searchParams.get('userId') || _user.id;
        const channel = searchParams.get('channel') as NotificationChannel | null;
        const status = searchParams.get('status') as NotificationStatus | null;
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);
        
        let query = `
          SELECT * FROM notifications
          WHERE user_id = $1
        `;
        const params: unknown[] = [userId];
        let paramIndex = 2;
        
        if (channel) {
          query += ` AND channel = $${paramIndex++}`;
          params.push(channel);
        }
        
        if (status) {
          query += ` AND status = $${paramIndex++}`;
          params.push(status);
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);
        
        const rows = await db.queryAll<Record<string, unknown>>(query, params);
        const notifications = rows.map(mapNotificationFromDB);
        
        const countResult = await db.queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1`,
          [userId]
        );
        
        return NextResponse.json({
          success: true,
          data: notifications,
          pagination: {
            total: parseInt(countResult?.count || '0', 10),
            limit,
            offset,
            hasMore: offset + notifications.length < parseInt(countResult?.count || '0', 10),
          },
        });
      }
      
      // -------------------------------------------------------------------------
      // Get Single Notification
      // -------------------------------------------------------------------------
      case 'get': {
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Notification ID is required' },
            { status: 400 }
          );
        }
        
        const row = await db.queryOne<Record<string, unknown>>(
          `SELECT * FROM notifications WHERE id = $1`,
          [id]
        );
        
        if (!row) {
          return NextResponse.json(
            { success: false, error: 'Notification not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: mapNotificationFromDB(row),
        });
      }
      
      // -------------------------------------------------------------------------
      // Get Unread Notifications
      // -------------------------------------------------------------------------
      case 'unread': {
        const userId = searchParams.get('userId') || 'user-1';
        
        const rows = await db.queryAll<Record<string, unknown>>(
          `SELECT * FROM notifications 
           WHERE user_id = $1 AND read_at IS NULL
           ORDER BY created_at DESC`,
          [userId]
        );
        
        return NextResponse.json({
          success: true,
          data: rows.map(mapNotificationFromDB),
          count: rows.length,
        });
      }
      
      // -------------------------------------------------------------------------
      // Get Notification Count
      // -------------------------------------------------------------------------
      case 'count': {
        const userId = searchParams.get('userId') || 'user-1';
        
        const _result = await db.queryOne<{
          total: string;
          unread: string;
          by_channel: Record<string, string>;
          by_priority: Record<string, string>;
        }>(
          `SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE read_at IS NULL) as unread,
            jsonb_object_agg(COALESCE(channel, 'unknown'), channel_count) as by_channel,
            jsonb_object_agg(COALESCE(priority, 'unknown'), priority_count) as by_priority
           FROM (
             SELECT channel, priority, COUNT(*) as channel_count, COUNT(*) as priority_count
             FROM notifications WHERE user_id = $1
             GROUP BY channel, priority
           ) sub`,
          [userId]
        );
        
        // Simplified counts
        const totalResult = await db.queryOne<{ total: string; unread: string }>(
          `SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE read_at IS NULL) as unread
           FROM notifications WHERE user_id = $1`,
          [userId]
        );
        
        return NextResponse.json({
          success: true,
          data: {
            total: parseInt(totalResult?.total || '0', 10),
            unread: parseInt(totalResult?.unread || '0', 10),
          },
        });
      }
      
      // -------------------------------------------------------------------------
      // List Templates
      // -------------------------------------------------------------------------
      case 'templates': {
        const organizationId = searchParams.get('organizationId') || 'org-1';
        const channel = searchParams.get('channel') as NotificationChannel | null;
        const activeOnly = searchParams.get('activeOnly') === 'true';
        
        let query = `SELECT * FROM notification_templates WHERE organization_id = $1`;
        const params: unknown[] = [organizationId];
        let paramIndex = 2;
        
        if (channel) {
          query += ` AND channel = $${paramIndex++}`;
          params.push(channel);
        }
        
        if (activeOnly) {
          query += ` AND is_active = true`;
        }
        
        query += ` ORDER BY name ASC`;
        
        const rows = await db.queryAll<Record<string, unknown>>(query, params);
        
        return NextResponse.json({
          success: true,
          data: rows.map(mapTemplateFromDB),
        });
      }
      
      // -------------------------------------------------------------------------
      // Get Single Template
      // -------------------------------------------------------------------------
      case 'template': {
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Template ID is required' },
            { status: 400 }
          );
        }
        
        const row = await db.queryOne<Record<string, unknown>>(
          `SELECT * FROM notification_templates WHERE id = $1`,
          [id]
        );
        
        if (!row) {
          return NextResponse.json(
            { success: false, error: 'Template not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: mapTemplateFromDB(row),
        });
      }
      
      // -------------------------------------------------------------------------
      // Get User Preferences
      // -------------------------------------------------------------------------
      case 'preferences': {
        const userId = searchParams.get('userId') || 'user-1';
        
        const row = await db.queryOne<Record<string, unknown>>(
          `SELECT * FROM notification_preferences WHERE user_id = $1`,
          [userId]
        );
        
        if (!row) {
          // Return default preferences if none exist
          return NextResponse.json({
            success: true,
            data: getDefaultPreferences(userId),
          });
        }
        
        return NextResponse.json({
          success: true,
          data: mapPreferencesFromDB(row),
        });
      }
      
      // -------------------------------------------------------------------------
      // List Queue Items
      // -------------------------------------------------------------------------
      case 'queue': {
        const status = searchParams.get('status') as QueueStatus | null;
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        
        let query = `SELECT * FROM notification_queue`;
        const params: unknown[] = [];
        
        if (status) {
          query += ` WHERE status = $1`;
          params.push(status);
        }
        
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        
        const rows = await db.queryAll<Record<string, unknown>>(query, params);
        
        return NextResponse.json({
          success: true,
          data: rows.map(mapQueueItemFromDB),
        });
      }
      
      // -------------------------------------------------------------------------
      // List Push Subscriptions
      // -------------------------------------------------------------------------
      case 'push-subscriptions': {
        const userId = searchParams.get('userId') || 'user-1';
        
        const rows = await db.queryAll<Record<string, unknown>>(
          `SELECT * FROM push_subscriptions WHERE user_id = $1 ORDER BY created_at DESC`,
          [userId]
        );
        
        return NextResponse.json({
          success: true,
          data: rows.map(mapPushSubscriptionFromDB),
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error('Notifications GET error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { success: false, error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(request: NextRequest) {
  // Check authentication and rate limiting
  const authCheck = await checkAuthAndRateLimit(request);
  if ('error' in authCheck) {
    return authCheck.error;
  }
  const user = authCheck.user;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'send';
  
  try {
    const body = await request.json();
    
    switch (action) {
      // -------------------------------------------------------------------------
      // Send Notification
      // -------------------------------------------------------------------------
      case 'send': {
        const { userId, channel, title, body: notifBody, data, actionUrl, priority } = body;
        
        if (!userId || !channel || !title || !notifBody) {
          return NextResponse.json(
            { success: false, error: 'userId, channel, title, and body are required' },
            { status: 400 }
          );
        }

        // Log audit event
        await logAudit(
          user.organizationId,
          user.id,
          'SEND_NOTIFICATION',
          'notification',
          userId,
          { targetUserId: userId, channel, title },
          request
        );
        
        // Check user preferences
        const prefsRow = await db.queryOne<Record<string, unknown>>(
          `SELECT * FROM notification_preferences WHERE user_id = $1`,
          [userId]
        );
        
        if (prefsRow) {
          const prefs = mapPreferencesFromDB(prefsRow);
          
          // Check if notifications are enabled
          if (!prefs.enabled) {
            return NextResponse.json({
              success: false,
              error: 'User has disabled notifications',
            }, { status: 403 });
          }
          
          // Check channel preference
          if (!prefs.channels[channel as NotificationChannel]?.enabled) {
            return NextResponse.json({
              success: false,
              error: `User has disabled ${channel} notifications`,
            }, { status: 403 });
          }
          
          // Check quiet hours
          if (isWithinQuietHours(prefs.quietHours)) {
            // Queue for later delivery instead of sending now
            const row = await db.queryOne<Record<string, unknown>>(
              `INSERT INTO notifications (user_id, channel, title, body, data, action_url, priority, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
               RETURNING *`,
              [userId, channel, title, notifBody, JSON.stringify(data || {}), actionUrl, priority || 'normal']
            );
            
            if (row) {
              const notification = mapNotificationFromDB(row);
              await queueNotificationForDelivery(
                notification.id,
                channel,
                userId,
                { title, body: notifBody, data, actionUrl },
                prefs.quietHours?.end
              );
              
              return NextResponse.json({
                success: true,
                data: notification,
                message: 'Notification queued for delivery after quiet hours',
              });
            }
          }
        }
        
        // Create and send notification
        const row = await db.queryOne<Record<string, unknown>>(
          `INSERT INTO notifications (user_id, channel, title, body, data, action_url, priority, status, sent_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', NOW())
           RETURNING *`,
          [userId, channel, title, notifBody, JSON.stringify(data || {}), actionUrl, priority || 'normal']
        );
        
        if (!row) {
          return NextResponse.json(
            { success: false, error: 'Failed to create notification' },
            { status: 500 }
          );
        }
        
        const notification = mapNotificationFromDB(row);
        
        // Attempt delivery
        const deliveryResult = await deliverNotification(notification, channel, userId);
        
        if (deliveryResult.success) {
          await db.query(
            `UPDATE notifications SET status = 'delivered' WHERE id = $1`,
            [notification.id]
          );
          notification.status = 'delivered';
        } else {
          await db.query(
            `UPDATE notifications SET status = 'failed' WHERE id = $1`,
            [notification.id]
          );
          notification.status = 'failed';
        }
        
        return NextResponse.json({
          success: true,
          data: notification,
          delivery: deliveryResult,
        });
      }
      
      // -------------------------------------------------------------------------
      // Send Bulk Notifications
      // -------------------------------------------------------------------------
      case 'send-bulk': {
        const { notifications: notificationList } = body;
        
        if (!Array.isArray(notificationList) || notificationList.length === 0) {
          return NextResponse.json(
            { success: false, error: 'notifications array is required' },
            { status: 400 }
          );
        }
        
        const results = await Promise.allSettled(
          notificationList.map(async (notif: {
            userId: string;
            channel: NotificationChannel;
            title: string;
            body: string;
            data?: Record<string, unknown>;
            actionUrl?: string;
            priority?: NotificationPriority;
          }) => {
            const row = await db.queryOne<Record<string, unknown>>(
              `INSERT INTO notifications (user_id, channel, title, body, data, action_url, priority, status, sent_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', NOW())
               RETURNING *`,
              [notif.userId, notif.channel, notif.title, notif.body, 
               JSON.stringify(notif.data || {}), notif.actionUrl, notif.priority || 'normal']
            );
            return row ? mapNotificationFromDB(row) : null;
          })
        );
        
        const sent = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.length - sent;
        
        return NextResponse.json({
          success: true,
          data: {
            total: notificationList.length,
            sent,
            failed,
          },
        });
      }
      
      // -------------------------------------------------------------------------
      // Send From Template
      // -------------------------------------------------------------------------
      case 'send-from-template': {
        const { templateId, userId, variables, channel: overrideChannel } = body;
        
        if (!templateId || !userId) {
          return NextResponse.json(
            { success: false, error: 'templateId and userId are required' },
            { status: 400 }
          );
        }
        
        const templateRow = await db.queryOne<Record<string, unknown>>(
          `SELECT * FROM notification_templates WHERE id = $1 AND is_active = true`,
          [templateId]
        );
        
        if (!templateRow) {
          return NextResponse.json(
            { success: false, error: 'Template not found or inactive' },
            { status: 404 }
          );
        }
        
        const template = mapTemplateFromDB(templateRow);
        const channel = overrideChannel || template.channel;
        const renderedTitle = template.subject ? renderTemplate(template.subject, variables || {}) : template.name;
        const renderedBody = renderTemplate(template.body, variables || {});
        
        const row = await db.queryOne<Record<string, unknown>>(
          `INSERT INTO notifications (user_id, channel, title, body, data, status, sent_at)
           VALUES ($1, $2, $3, $4, $5, 'sent', NOW())
           RETURNING *`,
          [userId, channel, renderedTitle, renderedBody, JSON.stringify({ templateId, variables: variables || {} })]
        );
        
        if (!row) {
          return NextResponse.json(
            { success: false, error: 'Failed to create notification' },
            { status: 500 }
          );
        }
        
        const notification = mapNotificationFromDB(row);
        const deliveryResult = await deliverNotification(notification, channel, userId);
        
        if (deliveryResult.success) {
          await db.query(
            `UPDATE notifications SET status = 'delivered' WHERE id = $1`,
            [notification.id]
          );
          notification.status = 'delivered';
        }
        
        return NextResponse.json({
          success: true,
          data: notification,
          template: template.name,
          delivery: deliveryResult,
        });
      }
      
      // -------------------------------------------------------------------------
      // Mark All as Read
      // -------------------------------------------------------------------------
      case 'mark-all-read': {
        const { userId } = body;
        
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'userId is required' },
            { status: 400 }
          );
        }
        
        const result = await db.query(
          `UPDATE notifications SET read_at = NOW(), status = 'read' 
           WHERE user_id = $1 AND read_at IS NULL`,
          [userId]
        );
        
        return NextResponse.json({
          success: true,
          data: { updated: result.rowCount || 0 },
        });
      }
      
      // -------------------------------------------------------------------------
      // Create Template
      // -------------------------------------------------------------------------
      case 'create-template': {
        const { organizationId, name, channel, subject, body: templateBody, variables, createdBy } = body;
        
        if (!name || !channel || !templateBody || !createdBy) {
          return NextResponse.json(
            { success: false, error: 'name, channel, body, and createdBy are required' },
            { status: 400 }
          );
        }
        
        const row = await db.queryOne<Record<string, unknown>>(
          `INSERT INTO notification_templates (organization_id, name, channel, subject, body, variables, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [organizationId || 'org-1', name, channel, subject, templateBody, variables || [], createdBy]
        );
        
        if (!row) {
          return NextResponse.json(
            { success: false, error: 'Failed to create template' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: mapTemplateFromDB(row),
        }, { status: 201 });
      }
      
      // -------------------------------------------------------------------------
      // Subscribe to Push Notifications
      // -------------------------------------------------------------------------
      case 'push-subscribe': {
        const { userId, subscription } = body;
        
        if (!userId || !subscription?.endpoint || !subscription?.keys) {
          return NextResponse.json(
            { success: false, error: 'userId and subscription (endpoint, keys) are required' },
            { status: 400 }
          );
        }
        
        // Upsert subscription
        const row = await db.queryOne<Record<string, unknown>>(
          `INSERT INTO push_subscriptions (user_id, endpoint, keys, user_agent)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (endpoint) DO UPDATE SET
             user_id = EXCLUDED.user_id,
             keys = EXCLUDED.keys,
             user_agent = EXCLUDED.user_agent
           RETURNING *`,
          [userId, subscription.endpoint, JSON.stringify(subscription.keys), subscription.userAgent]
        );
        
        if (!row) {
          return NextResponse.json(
            { success: false, error: 'Failed to save subscription' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: mapPushSubscriptionFromDB(row),
        });
      }
      
      // -------------------------------------------------------------------------
      // Unsubscribe from Push Notifications
      // -------------------------------------------------------------------------
      case 'push-unsubscribe': {
        const { userId, endpoint } = body;
        
        if (!userId || !endpoint) {
          return NextResponse.json(
            { success: false, error: 'userId and endpoint are required' },
            { status: 400 }
          );
        }
        
        await db.query(
          `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
          [userId, endpoint]
        );
        
        return NextResponse.json({
          success: true,
          message: 'Unsubscribed successfully',
        });
      }
      
      // -------------------------------------------------------------------------
      // Send Email (Direct)
      // -------------------------------------------------------------------------
      case 'send-email': {
        const { to, subject, body: emailBody, from, replyTo } = body;
        
        if (!to || !subject || !emailBody) {
          return NextResponse.json(
            { success: false, error: 'to, subject, and body are required' },
            { status: 400 }
          );
        }
        
        // Create notification record for tracking
        const row = await db.queryOne<Record<string, unknown>>(
          `INSERT INTO notifications (user_id, channel, title, body, data, status, sent_at)
           VALUES ($1, 'email', $2, $3, $4, 'sent', NOW())
           RETURNING *`,
          [to, subject, emailBody, JSON.stringify({ from, replyTo })]
        );
        
        // Send email via server API (avoids nodemailer in Next.js edge runtime)
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.cubeai.tools';
        try {
          const response = await fetch(`${API_BASE}/api/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.API_SECRET_KEY || ''}`,
            },
            body: JSON.stringify({
              to,
              from: from || 'noreply@cubeai.tools',
              replyTo,
              subject,
              html: emailBody,
              text: emailBody.replace(/<[^>]*>/g, ''),
            }),
          });
          if (response.ok) {
            log.debug(`[EMAIL] ✅ Sent to ${to}: ${subject}`);
          } else {
            const err = await response.json().catch(() => ({ message: 'Unknown' }));
            log.error(`[EMAIL] Failed to send to ${to}:`, err.message);
          }
        } catch (error) {
          log.error(`[EMAIL] Failed to send to ${to}:`, error);
        }
        
        return NextResponse.json({
          success: true,
          data: row ? mapNotificationFromDB(row) : null,
          message: 'Email queued for delivery',
        });
      }
      
      // -------------------------------------------------------------------------
      // Send SMS (Direct)
      // -------------------------------------------------------------------------
      case 'send-sms': {
        const { to, message } = body;
        
        if (!to || !message) {
          return NextResponse.json(
            { success: false, error: 'to and message are required' },
            { status: 400 }
          );
        }
        
        const row = await db.queryOne<Record<string, unknown>>(
          `INSERT INTO notifications (user_id, channel, title, body, status, sent_at)
           VALUES ($1, 'sms', 'SMS', $2, 'sent', NOW())
           RETURNING *`,
          [to, message]
        );
        
        // Send SMS via Twilio if configured
        const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
        const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
        const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
        
        if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM) {
          try {
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: message }),
            });
            if (response.ok) {
              log.debug(`[SMS] ✅ Sent to ${to}`);
            } else {
              const err = await response.json();
              log.error(`[SMS] Failed:`, err);
            }
          } catch (error) {
            log.error(`[SMS] Failed to send to ${to}:`, error);
          }
        } else {
          log.debug(`[SMS] (Mock) Would send to ${to}: ${message}`);
        }
        
        return NextResponse.json({
          success: true,
          data: row ? mapNotificationFromDB(row) : null,
          message: 'SMS queued for delivery',
        });
      }
      
      // -------------------------------------------------------------------------
      // Retry Queue Item
      // -------------------------------------------------------------------------
      case 'queue-retry': {
        const { queueId } = body;
        
        if (!queueId) {
          return NextResponse.json(
            { success: false, error: 'queueId is required' },
            { status: 400 }
          );
        }
        
        const queueRow = await db.queryOne<Record<string, unknown>>(
          `SELECT * FROM notification_queue WHERE id = $1`,
          [queueId]
        );
        
        if (!queueRow) {
          return NextResponse.json(
            { success: false, error: 'Queue item not found' },
            { status: 404 }
          );
        }
        
        const queueItem = mapQueueItemFromDB(queueRow);
        
        if (queueItem.attempts >= queueItem.maxAttempts) {
          return NextResponse.json({
            success: false,
            error: 'Maximum retry attempts reached',
          }, { status: 400 });
        }
        
        // Get the notification
        const notifRow = await db.queryOne<Record<string, unknown>>(
          `SELECT * FROM notifications WHERE id = $1`,
          [queueItem.notificationId]
        );
        
        if (!notifRow) {
          return NextResponse.json(
            { success: false, error: 'Notification not found' },
            { status: 404 }
          );
        }
        
        const notification = mapNotificationFromDB(notifRow);
        
        // Update queue item
        await db.query(
          `UPDATE notification_queue 
           SET status = 'processing', attempts = attempts + 1, last_attempt = NOW()
           WHERE id = $1`,
          [queueId]
        );
        
        // Attempt delivery
        const deliveryResult = await deliverNotification(
          notification,
          queueItem.channel,
          queueItem.recipientId
        );
        
        if (deliveryResult.success) {
          await db.query(
            `UPDATE notification_queue SET status = 'completed' WHERE id = $1`,
            [queueId]
          );
          await db.query(
            `UPDATE notifications SET status = 'delivered' WHERE id = $1`,
            [queueItem.notificationId]
          );
        } else {
          await db.query(
            `UPDATE notification_queue SET status = 'failed', error = $2 WHERE id = $1`,
            [queueId, deliveryResult.error]
          );
        }
        
        return NextResponse.json({
          success: true,
          data: {
            queueId,
            attempt: queueItem.attempts + 1,
            maxAttempts: queueItem.maxAttempts,
            deliveryResult,
          },
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error('Notifications POST error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT Handler
// =============================================================================

export async function PUT(request: NextRequest) {
  // Check authentication and rate limiting
  const authCheck = await checkAuthAndRateLimit(request);
  if ('error' in authCheck) {
    return authCheck.error;
  }
  const user = authCheck.user;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'update';
  
  try {
    const body = await request.json();
    
    // Log audit event
    await logAudit(
      user.organizationId,
      user.id,
      'UPDATE_NOTIFICATION',
      'notification',
      body.id || 'batch',
      { action, ...body },
      request
    );
    
    switch (action) {
      // -------------------------------------------------------------------------
      // Update Notification (Mark as Read)
      // -------------------------------------------------------------------------
      case 'update':
      case 'mark-read': {
        const { id, readAt } = body;
        
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Notification ID is required' },
            { status: 400 }
          );
        }
        
        const row = await db.queryOne<Record<string, unknown>>(
          `UPDATE notifications 
           SET read_at = $2, status = CASE WHEN $2 IS NOT NULL THEN 'read' ELSE status END
           WHERE id = $1
           RETURNING *`,
          [id, readAt ? new Date(readAt) : new Date()]
        );
        
        if (!row) {
          return NextResponse.json(
            { success: false, error: 'Notification not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: mapNotificationFromDB(row),
        });
      }
      
      // -------------------------------------------------------------------------
      // Update Template
      // -------------------------------------------------------------------------
      case 'update-template': {
        const { id, name, channel, subject, body: templateBody, variables, isActive } = body;
        
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Template ID is required' },
            { status: 400 }
          );
        }
        
        const updates: string[] = [];
        const params: unknown[] = [id];
        let paramIndex = 2;
        
        if (name !== undefined) {
          updates.push(`name = $${paramIndex++}`);
          params.push(name);
        }
        if (channel !== undefined) {
          updates.push(`channel = $${paramIndex++}`);
          params.push(channel);
        }
        if (subject !== undefined) {
          updates.push(`subject = $${paramIndex++}`);
          params.push(subject);
        }
        if (templateBody !== undefined) {
          updates.push(`body = $${paramIndex++}`);
          params.push(templateBody);
        }
        if (variables !== undefined) {
          updates.push(`variables = $${paramIndex++}`);
          params.push(variables);
        }
        if (isActive !== undefined) {
          updates.push(`is_active = $${paramIndex++}`);
          params.push(isActive);
        }
        
        if (updates.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No fields to update' },
            { status: 400 }
          );
        }
        
        const row = await db.queryOne<Record<string, unknown>>(
          `UPDATE notification_templates SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
          params
        );
        
        if (!row) {
          return NextResponse.json(
            { success: false, error: 'Template not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: mapTemplateFromDB(row),
        });
      }
      
      // -------------------------------------------------------------------------
      // Update Preferences
      // -------------------------------------------------------------------------
      case 'update-preferences': {
        const { userId, enabled, channels, categories, quietHours, digest } = body;
        
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'userId is required' },
            { status: 400 }
          );
        }
        
        // Upsert preferences
        const row = await db.queryOne<Record<string, unknown>>(
          `INSERT INTO notification_preferences (user_id, enabled, channels, categories, quiet_hours, digest)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id) DO UPDATE SET
             enabled = COALESCE($2, notification_preferences.enabled),
             channels = COALESCE($3, notification_preferences.channels),
             categories = COALESCE($4, notification_preferences.categories),
             quiet_hours = COALESCE($5, notification_preferences.quiet_hours),
             digest = COALESCE($6, notification_preferences.digest),
             updated_at = NOW()
           RETURNING *`,
          [
            userId,
            enabled ?? true,
            JSON.stringify(channels || getDefaultPreferences(userId).channels),
            JSON.stringify(categories || getDefaultPreferences(userId).categories),
            quietHours ? JSON.stringify(quietHours) : null,
            digest ? JSON.stringify(digest) : null,
          ]
        );
        
        if (!row) {
          return NextResponse.json(
            { success: false, error: 'Failed to update preferences' },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: mapPreferencesFromDB(row),
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error('Notifications PUT error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE Handler
// =============================================================================

export async function DELETE(request: NextRequest) {
  // Check authentication and rate limiting
  const authCheck = await checkAuthAndRateLimit(request);
  if ('error' in authCheck) {
    return authCheck.error;
  }
  const user = authCheck.user;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'delete';
  
  try {
    // Log audit event
    await logAudit(
      user.organizationId,
      user.id,
      'DELETE_NOTIFICATION',
      'notification',
      searchParams.get('id') || 'batch',
      { action, params: Object.fromEntries(searchParams) },
      request
    );

    switch (action) {
      // -------------------------------------------------------------------------
      // Delete Notification
      // -------------------------------------------------------------------------
      case 'delete': {
        const id = searchParams.get('id');
        
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Notification ID is required' },
            { status: 400 }
          );
        }
        
        const result = await db.query(
          `DELETE FROM notifications WHERE id = $1`,
          [id]
        );
        
        if (result.rowCount === 0) {
          return NextResponse.json(
            { success: false, error: 'Notification not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Notification deleted',
        });
      }
      
      // -------------------------------------------------------------------------
      // Delete Template
      // -------------------------------------------------------------------------
      case 'delete-template': {
        const id = searchParams.get('id');
        
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Template ID is required' },
            { status: 400 }
          );
        }
        
        const result = await db.query(
          `DELETE FROM notification_templates WHERE id = $1`,
          [id]
        );
        
        if (result.rowCount === 0) {
          return NextResponse.json(
            { success: false, error: 'Template not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Template deleted',
        });
      }
      
      // -------------------------------------------------------------------------
      // Clear Notifications for User
      // -------------------------------------------------------------------------
      case 'clear': {
        const userId = searchParams.get('userId');
        
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'userId is required' },
            { status: 400 }
          );
        }
        
        const result = await db.query(
          `DELETE FROM notifications WHERE user_id = $1`,
          [userId]
        );
        
        return NextResponse.json({
          success: true,
          message: `Deleted ${result.rowCount || 0} notifications`,
        });
      }
      
      // -------------------------------------------------------------------------
      // Delete Queue Item
      // -------------------------------------------------------------------------
      case 'delete-queue': {
        const id = searchParams.get('id');
        
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Queue ID is required' },
            { status: 400 }
          );
        }
        
        const result = await db.query(
          `DELETE FROM notification_queue WHERE id = $1`,
          [id]
        );
        
        if (result.rowCount === 0) {
          return NextResponse.json(
            { success: false, error: 'Queue item not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: 'Queue item deleted',
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error('Notifications DELETE error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// OPTIONS Handler - CORS Preflight
// =============================================================================

/**
 * Handle CORS preflight requests with origin validation
 */
export function OPTIONS(request: NextRequest): NextResponse {
  return handleCorsOptions(request);
}