/**
 * CUBE Workspace - Chrome Extension
 * Monday.com-like Work Management
 * Full implementation with local storage sync
 */

'use strict';

// ==================== State ====================
const WorkspaceState = {
  boards: [],
  activeBoard: null,
  activeView: 'table',
  selectedItems: [],
  searchQuery: '',
  sidebarOpen: true,
  initialized: false,
};

// ==================== Sample Data ====================
const createSampleData = () => {
  const now = new Date();
  return {
    boards: [
      {
        id: 'board-1',
        name: 'Project Alpha',
        description: 'Main project tracking board',
        icon: '🚀',
        color: '#8b5cf6',
        starred: false,
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
                person: 'JD',
                personColor: 'linear-gradient(135deg, #8b5cf6, #8b5cf6)',
                status: 'working',
                statusLabel: 'Working on it',
                statusColor: '#fdab3d',
                priority: 'high',
                priorityLabel: 'High',
                priorityColor: '#e2445c',
                dueDate: 'Dec 20',
                progress: 65,
              },
              {
                id: 'item-2',
                name: 'API integration',
                person: 'SM',
                personColor: 'linear-gradient(135deg, #00c875, #00d68f)',
                status: 'done',
                statusLabel: 'Done',
                statusColor: '#00c875',
                priority: 'medium',
                priorityLabel: 'Medium',
                priorityColor: '#fdab3d',
                dueDate: 'Dec 18',
                progress: 100,
              },
              {
                id: 'item-3',
                name: 'User authentication flow',
                person: null,
                status: 'todo',
                statusLabel: 'To Do',
                statusColor: '#797e93',
                priority: 'high',
                priorityLabel: 'High',
                priorityColor: '#e2445c',
                dueDate: null,
                progress: 0,
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
                id: 'item-4',
                name: 'Performance optimization',
                person: 'JD',
                personColor: 'linear-gradient(135deg, #8b5cf6, #8b5cf6)',
                status: 'stuck',
                statusLabel: 'Stuck',
                statusColor: '#e2445c',
                priority: 'critical',
                priorityLabel: 'Critical ⚠️',
                priorityColor: '#333333',
                dueDate: 'Dec 25',
                progress: 30,
              },
            ],
          },
        ],
        views: ['table', 'kanban', 'timeline', 'calendar', 'chart'],
        automations: [
          {
            id: 'auto-1',
            name: 'When status changes to Done → Notify team',
            enabled: true,
            runs: 12,
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'board-2',
        name: 'Marketing',
        description: 'Marketing campaigns and content',
        icon: '💼',
        color: '#00c875',
        starred: true,
        groups: [],
        views: ['table', 'kanban'],
        automations: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'board-3',
        name: 'Design Sprint',
        description: 'UI/UX design tasks',
        icon: '🎨',
        color: '#fdab3d',
        starred: false,
        groups: [],
        views: ['table', 'kanban'],
        automations: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
};

// ==================== Storage ====================
const Storage = {
  KEY: 'cube_workspace_data',

  async load() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([this.KEY], (result) => {
          if (result[this.KEY]) {
            resolve(result[this.KEY]);
          } else {
            const sampleData = createSampleData();
            this.save(sampleData);
            resolve(sampleData);
          }
        });
      } else {
        const stored = localStorage.getItem(this.KEY);
        if (stored) {
          resolve(JSON.parse(stored));
        } else {
          const sampleData = createSampleData();
          this.save(sampleData);
          resolve(sampleData);
        }
      }
    });
  },

  async save(data) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [this.KEY]: data }, resolve);
      } else {
        localStorage.setItem(this.KEY, JSON.stringify(data));
        resolve();
      }
    });
  },
};

// ==================== DOM Elements ====================
const Elements = {
  init() {
    this.backBtn = document.getElementById('backToMain');
    this.createBoardBtn = document.getElementById('createBoardBtn');
    this.toggleSidebar = document.getElementById('toggleSidebar');
    this.sidebar = document.querySelector('.ws-ext-sidebar');
    this.searchBoards = document.getElementById('searchBoards');
    this.searchItems = document.getElementById('searchItems');
    this.allBoards = document.getElementById('allBoards');
    this.favoriteBoards = document.getElementById('favoriteBoards');
    this.boardTitle = document.getElementById('boardTitle');
    this.boardDescription = document.getElementById('boardDescription');
    this.boardEmoji = document.getElementById('boardEmoji');
    this.starBoard = document.getElementById('starBoard');
    this.viewTabs = document.querySelectorAll('.ws-ext-view-tab');
    this.tableView = document.getElementById('tableView');
    this.kanbanView = document.getElementById('kanbanView');
    this.timelineView = document.getElementById('timelineView');
    this.calendarView = document.getElementById('calendarView');
    this.chartView = document.getElementById('chartView');
    this.groupsContainer = document.getElementById('groupsContainer');
    this.createBoardModal = document.getElementById('createBoardModal');
    this.addColumnModal = document.getElementById('addColumnModal');
    this.automationsPanel = document.getElementById('automationsPanel');
    this.automationsBtn = document.getElementById('automationsBtn');
    this.filterBtn = document.getElementById('filterBtn');
    this.sortBtn = document.getElementById('sortBtn');
    this.addGroupBtn = document.getElementById('addGroupBtn');
    this.addColumnBtn = document.getElementById('addColumnBtn');
    this.selectAllItems = document.getElementById('selectAllItems');
  },
};

// ==================== Render Functions ====================
const Render = {
  boardList() {
    const { boards } = WorkspaceState;
    const favorites = boards.filter((b) => b.starred);
    const all = boards;

    Elements.favoriteBoards.innerHTML = favorites.length
      ? favorites
          .map(
            (b) => `
        <button class="ws-ext-board-item ${WorkspaceState.activeBoard?.id === b.id ? 'active' : ''}" 
                data-board-id="${b.id}">
          <span class="ws-ext-board-emoji">${b.icon}</span>
          <span>${b.name}</span>
        </button>
      `
          )
          .join('')
      : '<p style="padding: 8px 12px; color: var(--ws-ext-text-muted); font-size: 0.8rem;">No favorites yet</p>';

    Elements.allBoards.innerHTML = all
      .map(
        (b) => `
        <button class="ws-ext-board-item ${WorkspaceState.activeBoard?.id === b.id ? 'active' : ''}" 
                data-board-id="${b.id}">
          <span class="ws-ext-board-emoji">${b.icon}</span>
          <span>${b.name}</span>
        </button>
      `
      )
      .join('');

    this.attachBoardListeners();
  },

  attachBoardListeners() {
    document.querySelectorAll('.ws-ext-board-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const boardId = btn.dataset.boardId;
        Actions.selectBoard(boardId);
      });
    });
  },

  boardHeader() {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    Elements.boardTitle.textContent = board.name;
    Elements.boardDescription.textContent = board.description;
    Elements.boardEmoji.textContent = board.icon;
    Elements.starBoard.classList.toggle('starred', board.starred);
  },

  viewTabs() {
    Elements.viewTabs.forEach((tab) => {
      const view = tab.dataset.view;
      tab.classList.toggle('active', view === WorkspaceState.activeView);
    });
  },

  activeView() {
    const views = ['table', 'kanban', 'timeline', 'calendar', 'chart'];
    views.forEach((view) => {
      const el = document.getElementById(`${view}View`);
      if (el) {
        el.style.display = view === WorkspaceState.activeView ? '' : 'none';
      }
    });

    switch (WorkspaceState.activeView) {
      case 'table':
        this.tableView();
        break;
      case 'kanban':
        this.kanbanView();
        break;
      case 'timeline':
        this.timelineView();
        break;
      case 'calendar':
        this.calendarView();
        break;
      case 'chart':
        this.chartView();
        break;
    }
  },

  tableView() {
    const board = WorkspaceState.activeBoard;
    if (!board || !board.groups) return;

    Elements.groupsContainer.innerHTML = board.groups
      .map(
        (group) => `
        <div class="ws-ext-group" data-group-id="${group.id}">
          <div class="ws-ext-group-header" style="border-left-color: ${group.color};">
            <button class="ws-ext-group-toggle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${group.collapsed ? '<polyline points="9 6 15 12 9 18"/>' : '<polyline points="6 9 12 15 18 9"/>'}
              </svg>
            </button>
            <span class="ws-ext-group-name" style="color: ${group.color};">${group.name}</span>
            <span class="ws-ext-group-count">${group.items.length} items</span>
            <button class="ws-ext-group-menu">⋯</button>
          </div>
          ${
            !group.collapsed
              ? `
            <div class="ws-ext-group-items">
              ${group.items.map((item) => this.itemRow(item, group)).join('')}
              <div class="ws-ext-add-item-row">
                <button class="ws-ext-add-item-btn" data-group-id="${group.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          `
              : ''
          }
        </div>
      `
      )
      .join('');

    this.attachItemListeners();
  },

  itemRow(item, group) {
    const isSelected = WorkspaceState.selectedItems.includes(item.id);
    const progressColor = item.progress >= 100 ? '#00c875' : item.progress >= 50 ? '#fdab3d' : '#797e93';

    return `
      <div class="ws-ext-item-row ${isSelected ? 'selected' : ''}" data-item-id="${item.id}">
        <div class="ws-ext-item-cell ws-ext-cell-checkbox">
          <input type="checkbox" ${isSelected ? 'checked' : ''}>
        </div>
        <div class="ws-ext-item-cell ws-ext-cell-name">
          <span class="ws-ext-drag-handle">⋮⋮</span>
          <span class="ws-ext-item-text" contenteditable="true">${item.name}</span>
          <button class="ws-ext-expand-btn">↗</button>
        </div>
        <div class="ws-ext-item-cell ws-ext-cell-person">
          ${
            item.person
              ? `<div class="ws-ext-person-avatar" style="background: ${item.personColor};">${item.person}</div>`
              : '<button class="ws-ext-add-person-btn">+</button>'
          }
        </div>
        <div class="ws-ext-item-cell ws-ext-cell-status">
          <span class="ws-ext-status-badge" style="background: ${item.statusColor};">${item.statusLabel}</span>
        </div>
        <div class="ws-ext-item-cell ws-ext-cell-priority">
          <span class="ws-ext-status-badge" style="background: ${item.priorityColor};">${item.priorityLabel}</span>
        </div>
        <div class="ws-ext-item-cell ws-ext-cell-date">
          ${item.dueDate ? `<span class="ws-ext-date-value">${item.dueDate}</span>` : '<button class="ws-ext-add-date-btn">+ Date</button>'}
        </div>
        <div class="ws-ext-item-cell ws-ext-cell-progress">
          <div class="ws-ext-progress-bar">
            <div class="ws-ext-progress-fill" style="width: ${item.progress}%; background: ${progressColor};"></div>
          </div>
          <span class="ws-ext-progress-value">${item.progress}%</span>
        </div>
        <div class="ws-ext-item-cell ws-ext-cell-actions">
          <button class="ws-ext-delete-item-btn" data-item-id="${item.id}" data-group-id="${group.id}">🗑</button>
        </div>
      </div>
    `;
  },

  attachItemListeners() {
    document.querySelectorAll('.ws-ext-group-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const groupEl = e.target.closest('.ws-ext-group');
        const groupId = groupEl.dataset.groupId;
        Actions.toggleGroup(groupId);
      });
    });

    document.querySelectorAll('.ws-ext-add-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const groupId = btn.dataset.groupId;
        Actions.addItem(groupId);
      });
    });

    document.querySelectorAll('.ws-ext-delete-item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.itemId;
        const groupId = btn.dataset.groupId;
        Actions.deleteItem(groupId, itemId);
      });
    });

    document.querySelectorAll('.ws-ext-item-row input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', (e) => {
        const itemId = e.target.closest('.ws-ext-item-row').dataset.itemId;
        Actions.toggleItemSelection(itemId, e.target.checked);
      });
    });

    document.querySelectorAll('.ws-ext-item-text').forEach((el) => {
      el.addEventListener('blur', (e) => {
        const itemId = e.target.closest('.ws-ext-item-row').dataset.itemId;
        const newName = e.target.textContent.trim();
        Actions.updateItemName(itemId, newName);
      });
    });

    document.querySelectorAll('.ws-ext-status-badge').forEach((badge) => {
      badge.addEventListener('click', (e) => {
        const itemId = e.target.closest('.ws-ext-item-row')?.dataset.itemId;
        if (itemId) {
          const isStatus = e.target.closest('.ws-ext-cell-status');
          if (isStatus) {
            Actions.cycleStatus(itemId);
          }
        }
      });
    });
  },

  kanbanView() {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    const statuses = [
      { id: 'todo', label: 'To Do', color: '#797e93' },
      { id: 'working', label: 'Working on it', color: '#fdab3d' },
      { id: 'stuck', label: 'Stuck', color: '#e2445c' },
      { id: 'done', label: 'Done', color: '#00c875' },
    ];

    const getItemsByStatus = (statusId) => {
      const items = [];
      board.groups.forEach((g) => {
        g.items.forEach((item) => {
          if (item.status === statusId) {
            items.push(item);
          }
        });
      });
      return items;
    };

    Elements.kanbanView.innerHTML = statuses
      .map((status) => {
        const items = getItemsByStatus(status.id);
        return `
        <div class="ws-ext-kanban-column" data-status="${status.id}">
          <div class="ws-ext-kanban-header" style="background: ${status.color};">
            <span>${status.label}</span>
            <span class="ws-ext-kanban-count">${items.length}</span>
          </div>
          <div class="ws-ext-kanban-cards">
            ${items
              .map(
                (item) => `
              <div class="ws-ext-kanban-card" data-item-id="${item.id}">
                <div class="ws-ext-kanban-card-title">${item.name}</div>
                <div class="ws-ext-kanban-card-meta">
                  <span class="ws-ext-kanban-priority" style="background: ${item.priorityColor};">${item.priorityLabel}</span>
                  ${item.person ? `<div class="ws-ext-person-avatar small" style="background: ${item.personColor};">${item.person}</div>` : ''}
                </div>
              </div>
            `
              )
              .join('')}
            <button class="ws-ext-kanban-add-card" data-status="${status.id}">+ Add item</button>
          </div>
        </div>
      `;
      })
      .join('');
  },

  timelineView() {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    const allItems = [];
    board.groups.forEach((g) => {
      g.items.forEach((item) => allItems.push({ ...item, groupColor: g.color }));
    });

    const timelineBody = Elements.timelineView.querySelector('.ws-ext-timeline-body');
    if (timelineBody) {
      timelineBody.innerHTML = allItems
        .map(
          (item, index) => `
        <div class="ws-ext-timeline-row">
          <div class="ws-ext-timeline-item-name">${item.name}</div>
          <div class="ws-ext-timeline-bar-container">
            <div class="ws-ext-timeline-bar" style="background: ${item.groupColor}; left: ${5 + index * 8}%; width: ${15 + Math.random() * 20}%;"></div>
          </div>
        </div>
      `
        )
        .join('');
    }
  },

  calendarView() {
    const calendarGrid = Elements.calendarView.querySelector('.ws-ext-calendar-grid');
    if (!calendarGrid) return;

    const dayHeaders = calendarGrid.querySelectorAll('.ws-ext-calendar-day-header');
    const existingDays = calendarGrid.querySelectorAll('.ws-ext-calendar-day');
    existingDays.forEach((d) => d.remove());

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'ws-ext-calendar-day other-month';
      calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'ws-ext-calendar-day';
      dayEl.innerHTML = `<span class="ws-ext-calendar-day-number">${day}</span>`;
      if (day === now.getDate()) {
        dayEl.style.background = 'rgba(124, 58, 237, 0.1)';
      }
      calendarGrid.appendChild(dayEl);
    }

    const totalCells = startDayOfWeek + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'ws-ext-calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
      }
    }
  },

  chartView() {
    // Chart is pre-rendered in HTML, could add dynamic updates here
    console.log('📊 Chart view rendered');
  },
};

// ==================== Actions ====================
const Actions = {
  selectBoard(boardId) {
    const board = WorkspaceState.boards.find((b) => b.id === boardId);
    if (board) {
      WorkspaceState.activeBoard = board;
      WorkspaceState.selectedItems = [];
      Render.boardList();
      Render.boardHeader();
      Render.activeView();
    }
  },

  switchView(viewName) {
    WorkspaceState.activeView = viewName;
    Render.viewTabs();
    Render.activeView();
  },

  toggleSidebar() {
    WorkspaceState.sidebarOpen = !WorkspaceState.sidebarOpen;
    Elements.sidebar.classList.toggle('collapsed', !WorkspaceState.sidebarOpen);
  },

  toggleGroup(groupId) {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    const group = board.groups.find((g) => g.id === groupId);
    if (group) {
      group.collapsed = !group.collapsed;
      Storage.save({ boards: WorkspaceState.boards });
      Render.tableView();
    }
  },

  addItem(groupId) {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    const group = board.groups.find((g) => g.id === groupId);
    if (group) {
      const newItem = {
        id: `item-${Date.now()}`,
        name: 'New Item',
        person: null,
        status: 'todo',
        statusLabel: 'To Do',
        statusColor: '#797e93',
        priority: 'medium',
        priorityLabel: 'Medium',
        priorityColor: '#fdab3d',
        dueDate: null,
        progress: 0,
      };
      group.items.push(newItem);
      Storage.save({ boards: WorkspaceState.boards });
      Render.activeView();
    }
  },

  deleteItem(groupId, itemId) {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    const group = board.groups.find((g) => g.id === groupId);
    if (group) {
      group.items = group.items.filter((item) => item.id !== itemId);
      Storage.save({ boards: WorkspaceState.boards });
      Render.activeView();
    }
  },

  toggleItemSelection(itemId, selected) {
    if (selected) {
      if (!WorkspaceState.selectedItems.includes(itemId)) {
        WorkspaceState.selectedItems.push(itemId);
      }
    } else {
      WorkspaceState.selectedItems = WorkspaceState.selectedItems.filter((id) => id !== itemId);
    }
  },

  updateItemName(itemId, newName) {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    board.groups.forEach((group) => {
      const item = group.items.find((i) => i.id === itemId);
      if (item && item.name !== newName) {
        item.name = newName;
        Storage.save({ boards: WorkspaceState.boards });
      }
    });
  },

  cycleStatus(itemId) {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    const statuses = [
      { id: 'todo', label: 'To Do', color: '#797e93' },
      { id: 'working', label: 'Working on it', color: '#fdab3d' },
      { id: 'stuck', label: 'Stuck', color: '#e2445c' },
      { id: 'done', label: 'Done', color: '#00c875' },
    ];

    board.groups.forEach((group) => {
      const item = group.items.find((i) => i.id === itemId);
      if (item) {
        const currentIndex = statuses.findIndex((s) => s.id === item.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        const nextStatus = statuses[nextIndex];

        item.status = nextStatus.id;
        item.statusLabel = nextStatus.label;
        item.statusColor = nextStatus.color;

        if (nextStatus.id === 'done') {
          item.progress = 100;
        }

        Storage.save({ boards: WorkspaceState.boards });
        Render.activeView();
      }
    });
  },

  toggleBoardStar() {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    board.starred = !board.starred;
    Storage.save({ boards: WorkspaceState.boards });
    Render.boardList();
    Render.boardHeader();
  },

  addGroup() {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    const colors = ['#00c875', '#579bfc', '#fdab3d', '#e2445c', '#8b5cf6'];
    const newGroup = {
      id: `group-${Date.now()}`,
      name: `New Group ${board.groups.length + 1}`,
      color: colors[board.groups.length % colors.length],
      collapsed: false,
      items: [],
    };
    board.groups.push(newGroup);
    Storage.save({ boards: WorkspaceState.boards });
    Render.tableView();
  },

  createBoard(name, description, icon, template) {
    const newBoard = {
      id: `board-${Date.now()}`,
      name: name || 'New Board',
      description: description || '',
      icon: icon || '📋',
      color: '#8b5cf6',
      starred: false,
      groups:
        template === 'blank'
          ? [
              {
                id: `group-${Date.now()}`,
                name: 'Group 1',
                color: '#00c875',
                collapsed: false,
                items: [],
              },
            ]
          : createTemplateGroups(template),
      views: ['table', 'kanban', 'timeline', 'calendar', 'chart'],
      automations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    WorkspaceState.boards.push(newBoard);
    WorkspaceState.activeBoard = newBoard;
    Storage.save({ boards: WorkspaceState.boards });
    Render.boardList();
    Render.boardHeader();
    Render.activeView();
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  },

  openPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.style.display = 'flex';
    }
  },

  closePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.style.display = 'none';
    }
  },
};

// ==================== Template Groups ====================
function createTemplateGroups(template) {
  const baseGroup = (name, color) => ({
    id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    color,
    collapsed: false,
    items: [],
  });

  switch (template) {
    case 'project':
      return [baseGroup('Backlog', '#797e93'), baseGroup('In Progress', '#fdab3d'), baseGroup('Done', '#00c875')];
    case 'crm':
      return [baseGroup('Leads', '#579bfc'), baseGroup('Qualified', '#fdab3d'), baseGroup('Customers', '#00c875')];
    case 'marketing':
      return [baseGroup('Ideas', '#8b5cf6'), baseGroup('In Production', '#fdab3d'), baseGroup('Published', '#00c875')];
    case 'bugs':
      return [baseGroup('New', '#e2445c'), baseGroup('In Progress', '#fdab3d'), baseGroup('Fixed', '#00c875')];
    default:
      return [baseGroup('Group 1', '#00c875')];
  }
}

// ==================== Event Listeners ====================
function attachEventListeners() {
  Elements.backBtn?.addEventListener('click', () => {
    window.location.href = 'sidepanel.html';
  });

  Elements.toggleSidebar?.addEventListener('click', Actions.toggleSidebar);

  Elements.viewTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      Actions.switchView(view);
    });
  });

  Elements.starBoard?.addEventListener('click', Actions.toggleBoardStar);

  Elements.addGroupBtn?.addEventListener('click', Actions.addGroup);

  Elements.createBoardBtn?.addEventListener('click', () => {
    Actions.openModal('createBoardModal');
  });

  Elements.addColumnBtn?.addEventListener('click', () => {
    Actions.openModal('addColumnModal');
  });

  Elements.automationsBtn?.addEventListener('click', () => {
    Actions.openPanel('automationsPanel');
  });

  document.querySelectorAll('.ws-ext-modal-close').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.ws-ext-modal-overlay');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });

  document.querySelectorAll('.ws-ext-panel-close').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const panel = e.target.closest('.ws-ext-panel');
      if (panel) {
        panel.style.display = 'none';
      }
    });
  });

  document.getElementById('confirmCreateBoard')?.addEventListener('click', () => {
    const name = document.getElementById('newBoardName').value;
    const description = document.getElementById('newBoardDescription').value;
    const selectedEmoji = document.querySelector('.ws-ext-emoji-btn.selected');
    const icon = selectedEmoji?.dataset.emoji || '📋';
    const template = document.getElementById('newBoardTemplate').value;

    Actions.createBoard(name, description, icon, template);
    Actions.closeModal('createBoardModal');

    document.getElementById('newBoardName').value = '';
    document.getElementById('newBoardDescription').value = '';
  });

  document.getElementById('cancelCreateBoard')?.addEventListener('click', () => {
    Actions.closeModal('createBoardModal');
  });

  document.querySelectorAll('.ws-ext-emoji-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ws-ext-emoji-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  document.querySelectorAll('.ws-ext-column-type').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      console.log('Add column type:', type);
      Actions.closeModal('addColumnModal');
    });
  });

  document.querySelectorAll('.ws-ext-modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    });
  });

  Elements.searchBoards?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.ws-ext-board-item').forEach((item) => {
      const name = item.textContent.toLowerCase();
      item.style.display = name.includes(query) ? '' : 'none';
    });
  });

  Elements.searchItems?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.ws-ext-item-row').forEach((item) => {
      const name = item.querySelector('.ws-ext-item-text')?.textContent.toLowerCase() || '';
      item.style.display = name.includes(query) ? '' : 'none';
    });
  });

  Elements.selectAllItems?.addEventListener('change', (e) => {
    const board = WorkspaceState.activeBoard;
    if (!board) return;

    if (e.target.checked) {
      WorkspaceState.selectedItems = [];
      board.groups.forEach((g) => {
        g.items.forEach((item) => {
          WorkspaceState.selectedItems.push(item.id);
        });
      });
    } else {
      WorkspaceState.selectedItems = [];
    }
    Render.tableView();
  });

  document.getElementById('addBoardSidebar')?.addEventListener('click', () => {
    Actions.openModal('createBoardModal');
  });
}

// ==================== Initialize ====================
async function init() {
  console.log('🚀 CUBE Workspace initializing...');

  Elements.init();

  const data = await Storage.load();
  WorkspaceState.boards = data.boards || [];
  WorkspaceState.activeBoard = WorkspaceState.boards[0] || null;

  attachEventListeners();

  Render.boardList();
  Render.boardHeader();
  Render.viewTabs();
  Render.activeView();

  WorkspaceState.initialized = true;
  console.log('✅ CUBE Workspace initialized successfully');
}

document.addEventListener('DOMContentLoaded', init);
