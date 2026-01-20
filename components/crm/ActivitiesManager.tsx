'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ActivitiesManager');

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { CRMService, ActivityType } from '@/lib/services/crm-service';
import {
  Activity,
  Plus,
  Search,
  Calendar,
  Clock,
  Phone,
  Mail,
  Users,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Eye,
  User,
  CalendarDays
} from 'lucide-react';
import './ActivitiesManager.css';

// UI-specific activity item type
interface ActivityItem {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  contact_id?: string;
  contact_name?: string;
  company_id?: string;
  deal_id?: string;
  assigned_to?: string;
  due_date?: string;
  scheduled_at?: string;
  completed_at?: string;
  status: string;
  priority?: string;
  notes?: string;
  outcome?: string;
  created_at: string;
  updated_at?: string;
}

interface CreateActivityInput {
  activity_type: string;
  title: string;
  description?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  assigned_to?: string;
  due_date?: string;
  priority?: string;
  notes?: string;
}

// Helper to map lowercase activity types to the service's ActivityType enum
const mapActivityType = (type: string): ActivityType => {
  const typeMap: Record<string, ActivityType> = {
    'call': 'Call',
    'email': 'Email',
    'meeting': 'Meeting',
    'task': 'Task',
    'note': 'Note',
    'demo': 'Demo',
    'follow': 'Task' // Map 'follow' to 'Task' as a fallback
  };
  return typeMap[type.toLowerCase()] || 'Task';
};

const ActivitiesManager: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all');

  const [newActivity, setNewActivity] = useState<CreateActivityInput>({
    activity_type: 'task',
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: ''
  });

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CRMService.activities.getAll();
      setActivities(data as ActivityItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
      log.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.title.trim()) return;

    try {
      const activity = await CRMService.activities.create({
        activityType: mapActivityType(newActivity.activity_type),
        title: newActivity.title.trim(),
        description: newActivity.description || '',
        contactId: newActivity.contact_id || undefined,
        dealId: newActivity.deal_id || undefined,
        scheduledAt: newActivity.due_date || undefined
      });

      setActivities(prev => [...prev, activity as ActivityItem]);
      setNewActivity({
        activity_type: 'task',
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: ''
      });
      setShowNewActivity(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity');
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    try {
      await CRMService.activities.complete(activityId);
      setActivities(prev => prev.map(a =>
        a.id === activityId
          ? { ...a, status: 'completed' as const, completed_at: new Date().toISOString() }
          : a
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete activity');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      await CRMService.activities.delete(activityId);
      setActivities(prev => prev.filter(a => a.id !== activityId));
      setSelectedActivity(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete activity');
    }
  };

  const filteredActivities = useMemo(() => {
    let result = [...activities];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(activity =>
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        (activity.contact_name && activity.contact_name.toLowerCase().includes(query))
      );
    }

    if (selectedType) {
      result = result.filter(activity => activity.activity_type === selectedType);
    }

    if (selectedStatus) {
      result = result.filter(activity => activity.status === selectedStatus);
    }

    if (selectedPriority) {
      result = result.filter(activity => activity.priority === selectedPriority);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      result = result.filter(activity => {
        if (!activity.due_date) return false;
        const dueDate = new Date(activity.due_date);

        switch (dateFilter) {
          case 'today':
            return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          case 'week':
            return dueDate >= today && dueDate < weekEnd;
          case 'overdue':
            return dueDate < today && activity.status !== 'completed';
          default:
            return true;
        }
      });
    }

    // Sort by due date and priority
    result.sort((a, b) => {
      // Completed at the end
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;

      // Overdue first
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;

      // Then by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;

      return 0;
    });

    return result;
  }, [activities, searchQuery, selectedType, selectedStatus, selectedPriority, dateFilter]);

  const stats = useMemo(() => {
    const total = activities.length;
    const pending = activities.filter(a => a.status === 'pending').length;
    const completed = activities.filter(a => a.status === 'completed').length;
    const overdue = activities.filter(a => a.status === 'overdue').length;

    const byType: Record<string, number> = {};
    activities.forEach(a => {
      byType[a.activity_type] = (byType[a.activity_type] || 0) + 1;
    });

    const todayActivities = activities.filter(a => {
      if (!a.due_date) return false;
      const dueDate = new Date(a.due_date);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString();
    }).length;

    return { total, pending, completed, overdue, todayActivities, byType };
  }, [activities]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={16} />;
      case 'email': return <Mail size={16} />;
      case 'meeting': return <Users size={16} />;
      case 'task': return <CheckCircle2 size={16} />;
      case 'note': return <FileText size={16} />;
      case 'follow': return <MessageSquare size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      call: '#3b82f6',
      email: '#8b5cf6',
      meeting: '#10b981',
      task: '#f59e0b',
      note: '#6b7280',
      follow: '#ec4899'
    };
    return colors[type] || '#6b7280';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#ef4444'
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      completed: '#10b981',
      overdue: '#ef4444',
      cancelled: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'No date';
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (dateOnly.getTime() === today.getTime()) return 'Today';
    if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (dateOnly < today) {
      const days = Math.floor((today.getTime() - dateOnly.getTime()) / (24 * 60 * 60 * 1000));
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }).format(date);
  };

  const formatDateTime = (dateStr: string | undefined): string => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="activities-manager loading">
        <div className="loading-spinner">
          <RefreshCw className="animate-spin" size={32} />
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activities-manager">
      {/* Header */}
      <div className="activities-header">
        <div className="header-left">
          <h2>
            <Activity size={24} />
            Activities
          </h2>
          <span className="activity-count">{filteredActivities.length} activities</span>
        </div>
        <div className="header-actions">
          <button
            className="btn-refresh"
            onClick={loadActivities}
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <div className="view-toggle">
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={viewMode === 'calendar' ? 'active' : ''}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowNewActivity(true)}
          >
            <Plus size={18} />
            Add Activity
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="activities-stats">
        <div className="stat-card clickable" onClick={() => setDateFilter('all')}>
          <div className="stat-icon total">
            <Activity size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <div className="stat-card clickable" onClick={() => setDateFilter('today')}>
          <div className="stat-icon today">
            <CalendarDays size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.todayActivities}</span>
            <span className="stat-label">Today</span>
          </div>
        </div>
        <div className="stat-card clickable" onClick={() => setSelectedStatus('pending')}>
          <div className="stat-icon pending">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card clickable" onClick={() => setDateFilter('overdue')}>
          <div className="stat-icon overdue">
            <AlertCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
        <div className="stat-card clickable" onClick={() => setSelectedStatus('completed')}>
          <div className="stat-icon completed">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="activities-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="call">Calls</option>
            <option value="email">Emails</option>
            <option value="meeting">Meetings</option>
            <option value="task">Tasks</option>
            <option value="note">Notes</option>
            <option value="follow">Follow-ups</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="filter-select"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'overdue')}
            className="filter-select"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* New Activity Form */}
      {showNewActivity && (
        <div className="new-activity-form">
          <form onSubmit={handleCreateActivity}>
            <h3>Add New Activity</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Activity Type *</label>
                <select
                  value={newActivity.activity_type}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, activity_type: e.target.value }))}
                  required
                >
                  <option value="task">Task</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="note">Note</option>
                  <option value="follow">Follow-up</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newActivity.priority}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Title *</label>
                <input
                  type="text"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Activity title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="datetime-local"
                  value={newActivity.due_date || ''}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <input
                  type="text"
                  value={newActivity.assigned_to}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, assigned_to: e.target.value }))}
                  placeholder="Assignee name"
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Activity description..."
                  rows={3}
                />
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  value={newActivity.notes}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Create Activity</button>
              <button type="button" className="btn-secondary" onClick={() => setShowNewActivity(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="empty-state">
          <Activity size={48} />
          <h3>No activities found</h3>
          <p>Create your first activity to get started</p>
          <button className="btn-primary" onClick={() => setShowNewActivity(true)}>
            <Plus size={18} />
            Add Activity
          </button>
        </div>
      ) : (
        <div className="activities-list">
          {filteredActivities.map(activity => (
            <div
              key={activity.id}
              className={`activity-item ${activity.status}`}
              onClick={() => setSelectedActivity(activity)}
            >
              <div
                className="activity-type-icon"
                style={{ backgroundColor: getTypeColor(activity.activity_type) }}
              >
                {getTypeIcon(activity.activity_type)}
              </div>

              <div className="activity-content">
                <div className="activity-header">
                  <h4 className={activity.status === 'completed' ? 'completed' : ''}>
                    {activity.title}
                  </h4>
                  <div className="activity-badges">
                    <span
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(activity.priority || 'medium') }}
                    >
                      {activity.priority || 'medium'}
                    </span>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(activity.status) }}
                    >
                      {activity.status}
                    </span>
                  </div>
                </div>

                {activity.description && (
                  <p className="activity-description">{activity.description}</p>
                )}

                <div className="activity-meta">
                  {activity.contact_name && (
                    <span className="meta-item">
                      <User size={14} />
                      {activity.contact_name}
                    </span>
                  )}
                  {activity.due_date && (
                    <span className={`meta-item ${activity.status === 'overdue' ? 'overdue' : ''}`}>
                      <Calendar size={14} />
                      {formatDate(activity.due_date)}
                    </span>
                  )}
                  {activity.assigned_to && (
                    <span className="meta-item">
                      <Users size={14} />
                      {activity.assigned_to}
                    </span>
                  )}
                </div>
              </div>

              <div className="activity-actions" onClick={(e) => e.stopPropagation()}>
                {activity.status !== 'completed' && activity.status !== 'cancelled' && (
                  <button
                    className="btn-icon success"
                    onClick={() => handleCompleteActivity(activity.id)}
                    title="Complete"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                )}
                <button
                  className="btn-icon"
                  onClick={() => setSelectedActivity(activity)}
                  title="View"
                >
                  <Eye size={16} />
                </button>
                <button
                  className="btn-icon danger"
                  onClick={() => handleDeleteActivity(activity.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div className="activity-modal-overlay" onClick={() => setSelectedActivity(null)}>
          <div className="activity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="activity-header-info">
                <div
                  className="activity-type-icon large"
                  style={{ backgroundColor: getTypeColor(selectedActivity.activity_type) }}
                >
                  {getTypeIcon(selectedActivity.activity_type)}
                </div>
                <div>
                  <h3>{selectedActivity.title}</h3>
                  <span className="activity-type">{selectedActivity.activity_type}</span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedActivity(null)}>×</button>
            </div>
            <div className="modal-content">
              <div className="activity-details">
                <div className="detail-row">
                  <span className="label">Status</span>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedActivity.status) }}
                  >
                    {selectedActivity.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Priority</span>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(selectedActivity.priority || 'medium') }}
                  >
                    {selectedActivity.priority || 'medium'}
                  </span>
                </div>
                {selectedActivity.due_date && (
                  <div className="detail-row">
                    <span className="label">Due Date</span>
                    <span>{formatDateTime(selectedActivity.due_date)}</span>
                  </div>
                )}
                {selectedActivity.assigned_to && (
                  <div className="detail-row">
                    <span className="label">Assigned To</span>
                    <span>{selectedActivity.assigned_to}</span>
                  </div>
                )}
                {selectedActivity.contact_name && (
                  <div className="detail-row">
                    <span className="label">Contact</span>
                    <span>{selectedActivity.contact_name}</span>
                  </div>
                )}
                {selectedActivity.description && (
                  <div className="detail-row full">
                    <span className="label">Description</span>
                    <p>{selectedActivity.description}</p>
                  </div>
                )}
                {selectedActivity.notes && (
                  <div className="detail-row full">
                    <span className="label">Notes</span>
                    <p>{selectedActivity.notes}</p>
                  </div>
                )}
                {selectedActivity.outcome && (
                  <div className="detail-row full">
                    <span className="label">Outcome</span>
                    <p>{selectedActivity.outcome}</p>
                  </div>
                )}
                {selectedActivity.completed_at && (
                  <div className="detail-row">
                    <span className="label">Completed At</span>
                    <span>{formatDateTime(selectedActivity.completed_at)}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Created</span>
                  <span>{formatDateTime(selectedActivity.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              {selectedActivity.status !== 'completed' && selectedActivity.status !== 'cancelled' && (
                <button
                  className="btn-success"
                  onClick={() => {
                    handleCompleteActivity(selectedActivity.id);
                    setSelectedActivity(null);
                  }}
                >
                  <CheckCircle2 size={16} />
                  Complete
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => handleDeleteActivity(selectedActivity.id)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesManager;
