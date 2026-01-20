"use client";

import React, { useState } from 'react';
import {
  Plus, Search, Filter, LayoutGrid, Calendar,
  Users, Tag, ChevronDown, ChevronRight, MoreHorizontal,
  Star, StarOff, Trash2,
  MessageSquare, Paperclip, CheckCircle2, Circle,
  Timer, Target, Zap, ArrowUpRight,
  GripVertical, EyeOff, Share2,
  Table2, KanbanSquare, GanttChart, PieChart,
  FolderKanban, Workflow, Bot
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
// ==================== Types ====================
interface _WorkspaceItem {
  id: string;
  name: string;
  type: 'board' | 'dashboard' | 'doc' | 'form';
  icon: string;
  color: string;
  starred: boolean;
  lastViewed: Date;
  members: string[];
}

interface Board {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  groups: BoardGroup[];
  columns: BoardColumn[];
  views: BoardView[];
  automations: Automation[];
  integrations: Integration[];
  settings: BoardSettings;
  createdAt: Date;
  updatedAt: Date;
  starred: boolean;
  archived: boolean;
}

interface BoardGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
  items: BoardItem[];
}

interface BoardItem {
  id: string;
  name: string;
  values: Record<string, CellValue>;
  subitems: BoardItem[];
  updates: ItemUpdate[];
  createdAt: Date;
  updatedAt: Date;
}

interface BoardColumn {
  id: string;
  title: string;
  type: ColumnType;
  width: number;
  settings: ColumnSettings;
}

type ColumnType = 
  | 'text' 
  | 'status' 
  | 'person' 
  | 'date' 
  | 'timeline' 
  | 'numbers' 
  | 'checkbox'
  | 'dropdown'
  | 'link'
  | 'files'
  | 'tags'
  | 'rating'
  | 'progress'
  | 'time_tracking'
  | 'formula'
  | 'dependency'
  | 'mirror'
  | 'auto_number'
  | 'creation_log'
  | 'last_updated';

interface ColumnSettings {
  options?: StatusOption[];
  formula?: string;
  linkedBoard?: string;
  allowMultiple?: boolean;
  dateFormat?: string;
  numberFormat?: 'number' | 'currency' | 'percentage';
  currency?: string;
}

interface StatusOption {
  id: string;
  label: string;
  color: string;
}

interface CellValue {
  type: ColumnType;
  value: unknown;
  displayValue?: string;
}

interface BoardView {
  id: string;
  name: string;
  type: 'table' | 'kanban' | 'timeline' | 'calendar' | 'chart' | 'gantt' | 'workload' | 'files' | 'form';
  settings: ViewSettings;
  isDefault: boolean;
}

interface ViewSettings {
  groupBy?: string;
  sortBy?: { column: string; direction: 'asc' | 'desc' }[];
  filters?: ViewFilter[];
  hiddenColumns?: string[];
  columnOrder?: string[];
  kanbanColumn?: string;
  timelineColumn?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'donut';
}

interface ViewFilter {
  column: string;
  operator: 'is' | 'is_not' | 'contains' | 'not_contains' | 'greater' | 'less' | 'between' | 'empty' | 'not_empty';
  value: unknown;
}

interface Automation {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  enabled: boolean;
  lastRun?: Date;
  runCount: number;
}

interface AutomationTrigger {
  type: 'status_change' | 'date_arrived' | 'item_created' | 'column_change' | 'recurring' | 'webhook';
  conditions: Record<string, unknown>;
}

interface AutomationAction {
  type: 'notify' | 'create_item' | 'move_item' | 'change_status' | 'send_email' | 'webhook' | 'create_update';
  settings: Record<string, unknown>;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}

interface BoardSettings {
  permissions: 'everyone' | 'members' | 'owners';
  itemTerminology: { singular: string; plural: string };
  showTimeline: boolean;
  allowSubitems: boolean;
  defaultView: string;
}

interface ItemUpdate {
  id: string;
  author: string;
  text: string;
  attachments: string[];
  reactions: { emoji: string; users: string[] }[];
  createdAt: Date;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  teams: string[];
}

// ==================== Sample Data ====================
const defaultColumns: BoardColumn[] = [
  { id: 'name', title: 'Item', type: 'text', width: 300, settings: {} },
  { id: 'person', title: 'Owner', type: 'person', width: 120, settings: { allowMultiple: true } },
  { id: 'status', title: 'Status', type: 'status', width: 140, settings: {
    options: [
      { id: 'todo', label: 'To Do', color: '#797e93' },
      { id: 'working', label: 'Working on it', color: '#fdab3d' },
      { id: 'stuck', label: 'Stuck', color: '#e2445c' },
      { id: 'done', label: 'Done', color: '#00c875' },
    ]
  }},
  { id: 'priority', title: 'Priority', type: 'status', width: 120, settings: {
    options: [
      { id: 'critical', label: 'Critical ⚠️', color: '#333333' },
      { id: 'high', label: 'High', color: '#e2445c' },
      { id: 'medium', label: 'Medium', color: '#fdab3d' },
      { id: 'low', label: 'Low', color: '#579bfc' },
    ]
  }},
  { id: 'date', title: 'Due Date', type: 'date', width: 120, settings: { dateFormat: 'MMM D' } },
  { id: 'timeline', title: 'Timeline', type: 'timeline', width: 180, settings: {} },
  { id: 'progress', title: 'Progress', type: 'progress', width: 140, settings: {} },
  { id: 'time', title: 'Time Tracking', type: 'time_tracking', width: 140, settings: {} },
];

const sampleBoard: Board = {
  id: 'board-1',
  name: 'Project Alpha',
  description: 'Main project tracking board',
  color: '#8b5cf6',
  icon: '🚀',
  groups: [
    {
      id: 'group-1',
      name: 'Sprint 1',
      color: '#00c875',
      collapsed: false,
      items: [
        {
          id: 'item-1',
          name: 'Design system components',
          values: {
            person: { type: 'person', value: ['user-1'] },
            status: { type: 'status', value: 'working' },
            priority: { type: 'status', value: 'high' },
            date: { type: 'date', value: '2025-12-20' },
            progress: { type: 'progress', value: 65 },
          },
          subitems: [],
          updates: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'item-2',
          name: 'API integration',
          values: {
            person: { type: 'person', value: ['user-2'] },
            status: { type: 'status', value: 'todo' },
            priority: { type: 'status', value: 'critical' },
            date: { type: 'date', value: '2025-12-18' },
            progress: { type: 'progress', value: 0 },
          },
          subitems: [],
          updates: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    {
      id: 'group-2',
      name: 'Sprint 2',
      color: '#579bfc',
      collapsed: false,
      items: [
        {
          id: 'item-3',
          name: 'User authentication',
          values: {
            person: { type: 'person', value: ['user-1', 'user-2'] },
            status: { type: 'status', value: 'done' },
            priority: { type: 'status', value: 'high' },
            date: { type: 'date', value: '2025-12-10' },
            progress: { type: 'progress', value: 100 },
          },
          subitems: [],
          updates: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    {
      id: 'group-3',
      name: 'Backlog',
      color: '#797e93',
      collapsed: true,
      items: [
        {
          id: 'item-4',
          name: 'Performance optimization',
          values: {
            status: { type: 'status', value: 'todo' },
            priority: { type: 'status', value: 'low' },
          },
          subitems: [],
          updates: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  ],
  columns: defaultColumns,
  views: [
    { id: 'view-1', name: 'Main Table', type: 'table', settings: {}, isDefault: true },
    { id: 'view-2', name: 'Kanban', type: 'kanban', settings: { kanbanColumn: 'status' }, isDefault: false },
    { id: 'view-3', name: 'Timeline', type: 'timeline', settings: { timelineColumn: 'timeline' }, isDefault: false },
    { id: 'view-4', name: 'Calendar', type: 'calendar', settings: {}, isDefault: false },
    { id: 'view-5', name: 'Chart', type: 'chart', settings: { chartType: 'pie' }, isDefault: false },
  ],
  automations: [
    {
      id: 'auto-1',
      name: 'Notify on status change',
      trigger: { type: 'status_change', conditions: { column: 'status', to: 'done' } },
      actions: [{ type: 'notify', settings: { message: 'Item completed!' } }],
      enabled: true,
      runCount: 12,
    },
  ],
  integrations: [],
  settings: {
    permissions: 'everyone',
    itemTerminology: { singular: 'Task', plural: 'Tasks' },
    showTimeline: true,
    allowSubitems: true,
    defaultView: 'view-1',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  starred: true,
  archived: false,
};

const teamMembers: TeamMember[] = [
  { id: 'user-1', name: 'Alex Johnson', email: 'alex@cubeai.tools', avatar: 'AJ', role: 'owner', teams: ['Engineering'] },
  { id: 'user-2', name: 'Sarah Chen', email: 'sarah@cubeai.tools', avatar: 'SC', role: 'admin', teams: ['Design'] },
  { id: 'user-3', name: 'Mike Ross', email: 'mike@cubeai.tools', avatar: 'MR', role: 'member', teams: ['Engineering'] },
];

// ==================== Component ====================
export default function WorkspacePage() {
  const { t: _t } = useTranslation();
  const { toast } = useToast();
  
  // State
  const [boards, setBoards] = useState<Board[]>([sampleBoard]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(sampleBoard);
  const [activeView, setActiveView] = useState<BoardView | null>(sampleBoard.views[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [showAutomations, setShowAutomations] = useState(false);
  const [_showIntegrations, setShowIntegrations] = useState(false);
  const [_draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, _setActiveFilters] = useState<ViewFilter[]>([]);
  
  // ==================== Handlers ====================
  
  const handleCreateBoard = () => {
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      name: 'New Board',
      description: '',
      color: '#8b5cf6',
      icon: '📋',
      groups: [
        {
          id: `group-${Date.now()}`,
          name: 'Group 1',
          color: '#00c875',
          collapsed: false,
          items: [],
        },
      ],
      columns: [...defaultColumns],
      views: [
        { id: `view-${Date.now()}`, name: 'Main Table', type: 'table', settings: {}, isDefault: true },
      ],
      automations: [],
      integrations: [],
      settings: {
        permissions: 'everyone',
        itemTerminology: { singular: 'Item', plural: 'Items' },
        showTimeline: true,
        allowSubitems: true,
        defaultView: `view-${Date.now()}`,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      starred: false,
      archived: false,
    };
    
    setBoards([...boards, newBoard]);
    setActiveBoard(newBoard);
    setActiveView(newBoard.views[0]);
    toast({ title: 'Board Created', description: 'New board has been created' });
  };
  
  const handleAddGroup = () => {
    if (!activeBoard) return;
    
    const newGroup: BoardGroup = {
      id: `group-${Date.now()}`,
      name: 'New Group',
      color: getRandomColor(),
      collapsed: false,
      items: [],
    };
    
    const updatedBoard = {
      ...activeBoard,
      groups: [...activeBoard.groups, newGroup],
      updatedAt: new Date(),
    };
    
    setActiveBoard(updatedBoard);
    setBoards(boards.map(b => b.id === activeBoard.id ? updatedBoard : b));
  };
  
  const handleAddItem = (groupId: string) => {
    if (!activeBoard) return;
    
    const newItem: BoardItem = {
      id: `item-${Date.now()}`,
      name: 'New Item',
      values: {},
      subitems: [],
      updates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedGroups = activeBoard.groups.map(group => {
      if (group.id === groupId) {
        return { ...group, items: [...group.items, newItem] };
      }
      return group;
    });
    
    const updatedBoard = { ...activeBoard, groups: updatedGroups, updatedAt: new Date() };
    setActiveBoard(updatedBoard);
    setBoards(boards.map(b => b.id === activeBoard.id ? updatedBoard : b));
  };
  
  const handleUpdateCell = (itemId: string, columnId: string, value: CellValue) => {
    if (!activeBoard) return;
    
    const updatedGroups = activeBoard.groups.map(group => ({
      ...group,
      items: group.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            values: { ...item.values, [columnId]: value },
            updatedAt: new Date(),
          };
        }
        return item;
      }),
    }));
    
    const updatedBoard = { ...activeBoard, groups: updatedGroups, updatedAt: new Date() };
    setActiveBoard(updatedBoard);
    setBoards(boards.map(b => b.id === activeBoard.id ? updatedBoard : b));
    setEditingCell(null);
  };
  
  const handleDeleteItem = (itemId: string) => {
    if (!activeBoard) return;
    
    const updatedGroups = activeBoard.groups.map(group => ({
      ...group,
      items: group.items.filter(item => item.id !== itemId),
    }));
    
    const updatedBoard = { ...activeBoard, groups: updatedGroups, updatedAt: new Date() };
    setActiveBoard(updatedBoard);
    setBoards(boards.map(b => b.id === activeBoard.id ? updatedBoard : b));
    setSelectedItems(selectedItems.filter(id => id !== itemId));
  };
  
  const handleToggleGroup = (groupId: string) => {
    if (!activeBoard) return;
    
    const updatedGroups = activeBoard.groups.map(group => {
      if (group.id === groupId) {
        return { ...group, collapsed: !group.collapsed };
      }
      return group;
    });
    
    const updatedBoard = { ...activeBoard, groups: updatedGroups };
    setActiveBoard(updatedBoard);
  };
  
  const handleAddColumn = (type: ColumnType) => {
    if (!activeBoard) return;
    
    const columnTitles: Record<ColumnType, string> = {
      text: 'Text',
      status: 'Status',
      person: 'Person',
      date: 'Date',
      timeline: 'Timeline',
      numbers: 'Numbers',
      checkbox: 'Checkbox',
      dropdown: 'Dropdown',
      link: 'Link',
      files: 'Files',
      tags: 'Tags',
      rating: 'Rating',
      progress: 'Progress',
      time_tracking: 'Time Tracking',
      formula: 'Formula',
      dependency: 'Dependency',
      mirror: 'Mirror',
      auto_number: 'Auto Number',
      creation_log: 'Creation Log',
      last_updated: 'Last Updated',
    };
    
    const newColumn: BoardColumn = {
      id: `col-${Date.now()}`,
      title: columnTitles[type],
      type,
      width: 140,
      settings: type === 'status' ? {
        options: [
          { id: 'option-1', label: 'Option 1', color: '#00c875' },
          { id: 'option-2', label: 'Option 2', color: '#fdab3d' },
          { id: 'option-3', label: 'Option 3', color: '#e2445c' },
        ]
      } : {},
    };
    
    const updatedBoard = {
      ...activeBoard,
      columns: [...activeBoard.columns, newColumn],
      updatedAt: new Date(),
    };
    
    setActiveBoard(updatedBoard);
    setBoards(boards.map(b => b.id === activeBoard.id ? updatedBoard : b));
    setShowAddColumn(false);
    toast({ title: 'Column Added', description: `${columnTitles[type]} column has been added` });
  };
  
  const getRandomColor = () => {
    const colors = ['#00c875', '#579bfc', '#8b5cf6', '#ff7575', '#fdab3d', '#e2445c', '#00d2d2'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // ==================== Render Helpers ====================
  
  const renderStatusCell = (value: CellValue | undefined, column: BoardColumn, itemId: string) => {
    const options = column.settings.options || [];
    const selectedOption = options.find(o => o.id === value?.value);
    
    return (
      <div className="ws-status-cell" onClick={() => setEditingCell({ itemId, columnId: column.id })}>
        {selectedOption ? (
          <span className="ws-status-badge" style={{ backgroundColor: selectedOption.color }}>
            {selectedOption.label}
          </span>
        ) : (
          <span className="ws-status-empty">+ Status</span>
        )}
        
        {editingCell?.itemId === itemId && editingCell?.columnId === column.id && (
          <div className="ws-status-picker">
            {options.map(option => (
              <button
                key={option.id}
                className="ws-status-option"
                style={{ backgroundColor: option.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateCell(itemId, column.id, { type: 'status', value: option.id });
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderPersonCell = (value: CellValue | undefined, column: BoardColumn, itemId: string) => {
    const personIds = (value?.value as string[]) || [];
    const persons = teamMembers.filter(m => personIds.includes(m.id));
    
    return (
      <div className="ws-person-cell">
        {persons.length > 0 ? (
          <div className="ws-person-avatars">
            {persons.map(person => (
              <div key={person.id} className="ws-person-avatar" title={person.name}>
                {person.avatar}
              </div>
            ))}
          </div>
        ) : (
          <button className="ws-add-person" onClick={() => setEditingCell({ itemId, columnId: column.id })}>
            <Users size={14} />
          </button>
        )}
      </div>
    );
  };
  
  const renderDateCell = (value: CellValue | undefined, column: BoardColumn, itemId: string) => {
    const dateValue = value?.value as string;
    
    return (
      <div className="ws-date-cell">
        {dateValue ? (
          <span className="ws-date-value">
            {new Date(dateValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        ) : (
          <button className="ws-add-date" onClick={() => setEditingCell({ itemId, columnId: column.id })}>
            <Calendar size={14} />
          </button>
        )}
      </div>
    );
  };
  
  const renderProgressCell = (value: CellValue | undefined, _column: BoardColumn, _itemId: string) => {
    const progress = (value?.value as number) || 0;
    
    return (
      <div className="ws-progress-cell">
        <div className="ws-progress-bar">
          <div 
            className="ws-progress-fill" 
            style={{ 
              width: `${progress}%`,
              backgroundColor: progress === 100 ? '#00c875' : progress > 50 ? '#fdab3d' : '#579bfc'
            }}
          />
        </div>
        <span className="ws-progress-value">{progress}%</span>
      </div>
    );
  };
  
  const renderCell = (item: BoardItem, column: BoardColumn) => {
    const value = item.values[column.id];
    
    switch (column.type) {
      case 'status':
        return renderStatusCell(value, column, item.id);
      case 'person':
        return renderPersonCell(value, column, item.id);
      case 'date':
        return renderDateCell(value, column, item.id);
      case 'progress':
        return renderProgressCell(value, column, item.id);
      case 'checkbox':
        return (
          <div className="ws-checkbox-cell">
            <button 
              className={`ws-checkbox ${value?.value ? 'checked' : ''}`}
              onClick={() => handleUpdateCell(item.id, column.id, { type: 'checkbox', value: !value?.value })}
            >
              {value?.value ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </button>
          </div>
        );
      case 'time_tracking':
        return (
          <div className="ws-time-cell">
            <Timer size={14} />
            <span>{String(value?.value ?? '0h 0m')}</span>
          </div>
        );
      default:
        return (
          <div className="ws-text-cell">
            {typeof value?.value === 'object' ? JSON.stringify(value.value) : (value?.value?.toString() || '-')}
          </div>
        );
    }
  };
  
  // ==================== Render Views ====================
  
  const renderTableView = () => (
    <div className="ws-table-view">
      {/* Header */}
      <div className="ws-table-header">
        <div className="ws-header-cell ws-item-cell" style={{ width: 40 }}>
          <input 
            type="checkbox" 
            checked={selectedItems.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                const allIds = activeBoard?.groups.flatMap(g => g.items.map(i => i.id)) || [];
                setSelectedItems(allIds);
              } else {
                setSelectedItems([]);
              }
            }}
          />
        </div>
        {activeBoard?.columns.map(column => (
          <div 
            key={column.id} 
            className="ws-header-cell"
            style={{ width: column.width }}
          >
            {column.title}
          </div>
        ))}
        <div className="ws-header-cell ws-add-column">
          <button className="ws-add-column-btn" onClick={() => setShowAddColumn(true)}>
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {/* Groups */}
      {activeBoard?.groups.map(group => (
        <div key={group.id} className="ws-group">
          <div className="ws-group-header" style={{ borderLeftColor: group.color }}>
            <button 
              className="ws-group-toggle"
              onClick={() => handleToggleGroup(group.id)}
            >
              {group.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            <span className="ws-group-name" style={{ color: group.color }}>
              {group.name}
            </span>
            <span className="ws-group-count">{group.items.length} items</span>
            <button className="ws-group-menu">
              <MoreHorizontal size={16} />
            </button>
          </div>
          
          {!group.collapsed && (
            <div className="ws-group-items">
              {group.items.map(item => (
                <div 
                  key={item.id} 
                  className={`ws-item-row ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                  draggable
                  onDragStart={() => setDraggedItem(item.id)}
                  onDragEnd={() => setDraggedItem(null)}
                >
                  <div className="ws-item-cell ws-item-checkbox" style={{ width: 40 }}>
                    <input 
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                    />
                  </div>
                  
                  {activeBoard?.columns.map(column => (
                    <div 
                      key={column.id}
                      className="ws-item-cell"
                      style={{ width: column.width }}
                    >
                      {column.id === 'name' ? (
                        <div className="ws-item-name">
                          <GripVertical size={14} className="ws-drag-handle" />
                          <span 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const newName = e.currentTarget.textContent || '';
                              if (newName !== item.name) {
                                handleUpdateCell(item.id, 'name', { type: 'text', value: newName });
                              }
                            }}
                          >
                            {item.name}
                          </span>
                          <button className="ws-item-expand">
                            <MessageSquare size={14} />
                          </button>
                        </div>
                      ) : (
                        renderCell(item, column)
                      )}
                    </div>
                  ))}
                  
                  <div className="ws-item-actions">
                    <button onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Add Item */}
              <div className="ws-add-item-row">
                <button 
                  className="ws-add-item-btn"
                  onClick={() => handleAddItem(group.id)}
                >
                  <Plus size={16} />
                  <span>Add {activeBoard?.settings.itemTerminology.singular || 'Item'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {/* Add Group */}
      <button className="ws-add-group-btn" onClick={handleAddGroup}>
        <Plus size={16} />
        <span>Add new group</span>
      </button>
    </div>
  );
  
  const renderKanbanView = () => {
    const kanbanColumn = activeBoard?.columns.find(c => c.id === activeView?.settings.kanbanColumn || c.type === 'status');
    const options = kanbanColumn?.settings.options || [];
    
    const getItemsByStatus = (statusId: string) => {
      return activeBoard?.groups.flatMap(g => 
        g.items.filter(item => item.values[kanbanColumn?.id || '']?.value === statusId)
      ) || [];
    };
    
    return (
      <div className="ws-kanban-view">
        {options.map(option => (
          <div key={option.id} className="ws-kanban-column">
            <div className="ws-kanban-header" style={{ backgroundColor: option.color }}>
              <span>{option.label}</span>
              <span className="ws-kanban-count">{getItemsByStatus(option.id).length}</span>
            </div>
            <div className="ws-kanban-cards">
              {getItemsByStatus(option.id).map(item => (
                <div key={item.id} className="ws-kanban-card">
                  <div className="ws-kanban-card-title">{item.name}</div>
                  <div className="ws-kanban-card-meta">
                    {item.values.person && (
                      <div className="ws-person-avatars small">
                        {(item.values.person.value as string[])?.map(id => {
                          const person = teamMembers.find(m => m.id === id);
                          return person ? (
                            <div key={id} className="ws-person-avatar small" title={person.name}>
                              {person.avatar}
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    {item.values.date && (
                      <span className="ws-kanban-date">
                        {new Date(item.values.date.value as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <button className="ws-kanban-add-card" onClick={() => handleAddItem(activeBoard?.groups[0]?.id || '')}>
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderTimelineView = () => (
    <div className="ws-timeline-view">
      <div className="ws-timeline-header">
        <div className="ws-timeline-months">
          {['Dec 2025', 'Jan 2026', 'Feb 2026'].map(month => (
            <div key={month} className="ws-timeline-month">{month}</div>
          ))}
        </div>
      </div>
      <div className="ws-timeline-body">
        {activeBoard?.groups.map(group => (
          <div key={group.id} className="ws-timeline-group">
            <div className="ws-timeline-group-header" style={{ color: group.color }}>
              {group.name}
            </div>
            {group.items.map(item => (
              <div key={item.id} className="ws-timeline-item">
                <div className="ws-timeline-item-name">{item.name}</div>
                <div className="ws-timeline-bar-container">
                  <div 
                    className="ws-timeline-bar" 
                    style={{ 
                      backgroundColor: group.color,
                      left: '10%',
                      width: '40%'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderCalendarView = () => (
    <div className="ws-calendar-view">
      <div className="ws-calendar-header">
        <button><ChevronDown size={16} /></button>
        <span>December 2025</span>
        <button><ChevronDown size={16} /></button>
      </div>
      <div className="ws-calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="ws-calendar-day-header">{day}</div>
        ))}
        {Array.from({ length: 35 }, (_, i) => {
          const day = i - 0 + 1;
          const isCurrentMonth = day >= 1 && day <= 31;
          return (
            <div key={i} className={`ws-calendar-day ${isCurrentMonth ? '' : 'other-month'}`}>
              <span className="ws-calendar-day-number">{isCurrentMonth ? day : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
  
  const renderChartView = () => {
    const statusColumn = activeBoard?.columns.find(c => c.type === 'status');
    const options = statusColumn?.settings.options || [];
    
    const getCounts = () => {
      const counts: Record<string, number> = {};
      activeBoard?.groups.forEach(group => {
        group.items.forEach(item => {
          const status = item.values[statusColumn?.id || '']?.value as string;
          counts[status] = (counts[status] || 0) + 1;
        });
      });
      return counts;
    };
    
    const counts = getCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    
    return (
      <div className="ws-chart-view">
        <div className="ws-chart-container">
          <div className="ws-pie-chart">
            {options.map((option, index) => {
              const count = counts[option.id] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div 
                  key={option.id}
                  className="ws-pie-segment"
                  style={{
                    backgroundColor: option.color,
                    '--percentage': percentage,
                    '--rotation': options.slice(0, index).reduce((acc, o) => {
                      const c = counts[o.id] || 0;
                      return acc + (total > 0 ? (c / total) * 360 : 0);
                    }, 0),
                  } as React.CSSProperties}
                />
              );
            })}
          </div>
          <div className="ws-chart-legend">
            {options.map(option => (
              <div key={option.id} className="ws-legend-item">
                <span className="ws-legend-color" style={{ backgroundColor: option.color }} />
                <span className="ws-legend-label">{option.label}</span>
                <span className="ws-legend-value">{counts[option.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const renderActiveView = () => {
    switch (activeView?.type) {
      case 'table': return renderTableView();
      case 'kanban': return renderKanbanView();
      case 'timeline': return renderTimelineView();
      case 'calendar': return renderCalendarView();
      case 'chart': return renderChartView();
      default: return renderTableView();
    }
  };
  
  // ==================== Main Render ====================
  
  return (
    <AppLayout>
      <div className="workspace-page">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="ws-sidebar">
            <div className="ws-sidebar-header">
              <h2>Workspace</h2>
              <button onClick={() => setShowSidebar(false)}>
                <ChevronDown size={16} />
              </button>
            </div>
            
            <div className="ws-sidebar-search">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="ws-sidebar-section">
              <div className="ws-section-header">
                <Star size={14} />
                <span>Favorites</span>
              </div>
              {boards.filter(b => b.starred).map(board => (
                <button 
                  key={board.id}
                  className={`ws-board-item ${activeBoard?.id === board.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveBoard(board);
                    setActiveView(board.views.find(v => v.isDefault) || board.views[0]);
                  }}
                >
                  <span className="ws-board-icon">{board.icon}</span>
                  <span className="ws-board-name">{board.name}</span>
                </button>
              ))}
            </div>
            
            <div className="ws-sidebar-section">
              <div className="ws-section-header">
                <FolderKanban size={14} />
                <span>All Boards</span>
                <button className="ws-add-btn" onClick={handleCreateBoard}>
                  <Plus size={14} />
                </button>
              </div>
              {boards.map(board => (
                <button 
                  key={board.id}
                  className={`ws-board-item ${activeBoard?.id === board.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveBoard(board);
                    setActiveView(board.views.find(v => v.isDefault) || board.views[0]);
                  }}
                >
                  <span className="ws-board-icon">{board.icon}</span>
                  <span className="ws-board-name">{board.name}</span>
                </button>
              ))}
            </div>
            
            <div className="ws-sidebar-footer">
              <button className="ws-sidebar-action" onClick={() => setShowAutomations(true)}>
                <Zap size={16} />
                <span>Automations</span>
              </button>
              <button className="ws-sidebar-action" onClick={() => setShowIntegrations(true)}>
                <Workflow size={16} />
                <span>Integrations</span>
              </button>
            </div>
          </aside>
        )}
        
        {/* Main Content */}
        <main className="ws-main">
          {activeBoard ? (
            <>
              {/* Board Header */}
              <header className="ws-board-header">
                <div className="ws-board-info">
                  {!showSidebar && (
                    <button className="ws-toggle-sidebar" onClick={() => setShowSidebar(true)}>
                      <LayoutGrid size={18} />
                    </button>
                  )}
                  <span className="ws-board-icon-large">{activeBoard.icon}</span>
                  <div>
                    <h1>{activeBoard.name}</h1>
                    <p>{activeBoard.description || 'No description'}</p>
                  </div>
                  <button 
                    className={`ws-star-btn ${activeBoard.starred ? 'starred' : ''}`}
                    onClick={() => {
                      const updated = { ...activeBoard, starred: !activeBoard.starred };
                      setActiveBoard(updated);
                      setBoards(boards.map(b => b.id === activeBoard.id ? updated : b));
                    }}
                  >
                    {activeBoard.starred ? <Star size={18} /> : <StarOff size={18} />}
                  </button>
                </div>
                
                <div className="ws-board-actions">
                  <div className="ws-members">
                    {teamMembers.slice(0, 3).map(member => (
                      <div key={member.id} className="ws-member-avatar" title={member.name}>
                        {member.avatar}
                      </div>
                    ))}
                    <button className="ws-invite-btn">
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <button className="ws-action-btn">
                    <Bot size={16} />
                    <span>AI Assistant</span>
                  </button>
                  
                  <button className="ws-action-btn">
                    <Zap size={16} />
                    <span>Automate</span>
                  </button>
                  
                  <button className="ws-action-btn">
                    <Share2 size={16} />
                  </button>
                  
                  <button className="ws-action-btn">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </header>
              
              {/* View Tabs */}
              <div className="ws-view-tabs">
                <div className="ws-views">
                  {activeBoard.views.map(view => (
                    <button
                      key={view.id}
                      className={`ws-view-tab ${activeView?.id === view.id ? 'active' : ''}`}
                      onClick={() => setActiveView(view)}
                    >
                      {view.type === 'table' && <Table2 size={14} />}
                      {view.type === 'kanban' && <KanbanSquare size={14} />}
                      {view.type === 'timeline' && <GanttChart size={14} />}
                      {view.type === 'calendar' && <Calendar size={14} />}
                      {view.type === 'chart' && <PieChart size={14} />}
                      <span>{view.name}</span>
                    </button>
                  ))}
                  <button className="ws-add-view-btn">
                    <Plus size={14} />
                  </button>
                </div>
                
                <div className="ws-view-actions">
                  <button 
                    className={`ws-filter-btn ${activeFilters.length > 0 ? 'active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter size={14} />
                    <span>Filter</span>
                    {activeFilters.length > 0 && (
                      <span className="ws-filter-count">{activeFilters.length}</span>
                    )}
                  </button>
                  
                  <button className="ws-sort-btn">
                    <ArrowUpRight size={14} />
                    <span>Sort</span>
                  </button>
                  
                  <button className="ws-hide-btn">
                    <EyeOff size={14} />
                    <span>Hide</span>
                  </button>
                  
                  <div className="ws-search-items">
                    <Search size={14} />
                    <input type="text" placeholder="Search items..." />
                  </div>
                </div>
              </div>
              
              {/* Board Content */}
              <div className="ws-board-content">
                {renderActiveView()}
              </div>
            </>
          ) : (
            <div className="ws-empty-state">
              <FolderKanban size={64} />
              <h2>Welcome to Workspace</h2>
              <p>Create your first board to get started</p>
              <button className="ws-create-board-btn" onClick={handleCreateBoard}>
                <Plus size={18} />
                <span>Create Board</span>
              </button>
            </div>
          )}
        </main>
        
        {/* Add Column Modal */}
        {showAddColumn && (
          <div className="ws-modal-overlay" onClick={() => setShowAddColumn(false)}>
            <div className="ws-modal" onClick={e => e.stopPropagation()}>
              <div className="ws-modal-header">
                <h3>Add Column</h3>
                <button onClick={() => setShowAddColumn(false)}>×</button>
              </div>
              <div className="ws-column-types">
                <button onClick={() => handleAddColumn('text')}><span>Aa</span> Text</button>
                <button onClick={() => handleAddColumn('status')}><span>●</span> Status</button>
                <button onClick={() => handleAddColumn('person')}><Users size={16} /> Person</button>
                <button onClick={() => handleAddColumn('date')}><Calendar size={16} /> Date</button>
                <button onClick={() => handleAddColumn('timeline')}><GanttChart size={16} /> Timeline</button>
                <button onClick={() => handleAddColumn('numbers')}><span>#</span> Numbers</button>
                <button onClick={() => handleAddColumn('checkbox')}><CheckCircle2 size={16} /> Checkbox</button>
                <button onClick={() => handleAddColumn('dropdown')}><ChevronDown size={16} /> Dropdown</button>
                <button onClick={() => handleAddColumn('link')}><span>🔗</span> Link</button>
                <button onClick={() => handleAddColumn('files')}><Paperclip size={16} /> Files</button>
                <button onClick={() => handleAddColumn('tags')}><Tag size={16} /> Tags</button>
                <button onClick={() => handleAddColumn('rating')}><Star size={16} /> Rating</button>
                <button onClick={() => handleAddColumn('progress')}><Target size={16} /> Progress</button>
                <button onClick={() => handleAddColumn('time_tracking')}><Timer size={16} /> Time Tracking</button>
                <button onClick={() => handleAddColumn('formula')}><span>fx</span> Formula</button>
                <button onClick={() => handleAddColumn('dependency')}><span>⟷</span> Dependency</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Automations Panel */}
        {showAutomations && (
          <div className="ws-modal-overlay" onClick={() => setShowAutomations(false)}>
            <div className="ws-panel" onClick={e => e.stopPropagation()}>
              <div className="ws-panel-header">
                <h3><Zap size={18} /> Automations</h3>
                <button onClick={() => setShowAutomations(false)}>×</button>
              </div>
              <div className="ws-panel-content">
                <p className="ws-panel-description">
                  Automate repetitive tasks and streamline your workflow
                </p>
                
                <div className="ws-automation-templates">
                  <h4>Popular Templates</h4>
                  <div className="ws-template-grid">
                    <button className="ws-template-card">
                      <span className="ws-template-icon">🔔</span>
                      <span className="ws-template-name">Status changed → Notify</span>
                    </button>
                    <button className="ws-template-card">
                      <span className="ws-template-icon">📅</span>
                      <span className="ws-template-name">Date arrives → Create item</span>
                    </button>
                    <button className="ws-template-card">
                      <span className="ws-template-icon">📧</span>
                      <span className="ws-template-name">Item created → Send email</span>
                    </button>
                    <button className="ws-template-card">
                      <span className="ws-template-icon">➡️</span>
                      <span className="ws-template-name">Status changed → Move item</span>
                    </button>
                  </div>
                </div>
                
                <div className="ws-active-automations">
                  <h4>Active Automations ({activeBoard?.automations.length || 0})</h4>
                  {activeBoard?.automations.map(auto => (
                    <div key={auto.id} className="ws-automation-item">
                      <div className="ws-automation-info">
                        <span className="ws-automation-name">{auto.name}</span>
                        <span className="ws-automation-runs">{auto.runCount} runs</span>
                      </div>
                      <label className="ws-toggle">
                        <input type="checkbox" checked={auto.enabled} readOnly />
                        <span className="ws-toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
                
                <button className="ws-create-automation-btn">
                  <Plus size={16} />
                  <span>Create Custom Automation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
