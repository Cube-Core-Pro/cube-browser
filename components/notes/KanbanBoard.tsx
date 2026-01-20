/**
 * Kanban Board Component
 * CUBE Nexum Platform v2.0
 */

import React, { useState } from 'react';
import { Task, Category, TaskStatus, getPriorityColor, formatDueDate, isOverdue } from '@/types/notes';
import './KanbanBoard.css';

interface KanbanBoardProps {
  notes: Task[];
  categories: Category[];
  onSelectNote: (note: Task) => void;
  onUpdateNote: (note: Task) => void;
  onDeleteNote: (id: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  notes,
  categories,
  onSelectNote,
  onUpdateNote,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDeleteNote
}) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const columns: { status: TaskStatus; title: string; color: string }[] = [
    { status: 'todo', title: 'To Do', color: '#fbbf24' },
    { status: 'in-progress', title: 'In Progress', color: '#3b82f6' },
    { status: 'completed', title: 'Completed', color: '#10b981' },
    { status: 'cancelled', title: 'Cancelled', color: '#6b7280' }
  ];

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return notes.filter(task => task.task_status === status);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: TaskStatus) => {
    if (!draggedTask) return;

    const updatedTask: Task = {
      ...draggedTask,
      task_status: status,
      updated_at: Date.now(),
      completed_at: status === 'completed' ? Date.now() : null
    };

    onUpdateNote(updatedTask);
    setDraggedTask(null);
  };

  const getCategoryColor = (categoryId: string | null): string => {
    if (!categoryId) return '#6b7280';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#6b7280';
  };

  return (
    <div className="kanban-board">
      {columns.map(column => {
        const tasks = getTasksByStatus(column.status);
        
        return (
          <div
            key={column.status}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.status)}
          >
            <div className="kanban-column-header" ref={(el) => { if (el) el.style.borderLeftColor = column.color; }}>
              <h3>{column.title}</h3>
              <span className="task-count">{tasks.length}</span>
            </div>

            <div className="kanban-column-content">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`kanban-task ${isOverdue(task.due_date) ? 'overdue' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  onClick={() => onSelectNote(task)}
                  ref={(el) => { if (el) el.style.borderLeftColor = getCategoryColor(task.category); }}
                >
                  <div className="kanban-task-header">
                    <div
                      className="priority-indicator"
                      ref={(el) => { if (el) el.style.backgroundColor = getPriorityColor(task.priority); }}
                    />
                    <h4>{task.title}</h4>
                  </div>

                  {task.content && (
                    <p className="kanban-task-content">
                      {task.content.substring(0, 80)}
                      {task.content.length > 80 && '...'}
                    </p>
                  )}

                  {task.due_date && (
                    <div className={`kanban-task-due ${isOverdue(task.due_date) ? 'overdue' : ''}`}>
                      📅 {formatDueDate(task.due_date)}
                    </div>
                  )}

                  {task.subtasks.length > 0 && (
                    <div className="kanban-task-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          ref={(el) => { if (el) el.style.width = `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%`; }}
                        />
                      </div>
                      <span className="progress-text">
                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                      </span>
                    </div>
                  )}

                  {task.tags.length > 0 && (
                    <div className="kanban-task-tags">
                      {task.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="kanban-tag">#{tag}</span>
                      ))}
                      {task.tags.length > 2 && (
                        <span className="tags-more">+{task.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="kanban-empty">
                  <p>No tasks</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
