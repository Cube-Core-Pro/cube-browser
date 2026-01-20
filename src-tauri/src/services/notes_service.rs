// Notes & Tasks Service
use crate::models::notes::*;
use rusqlite::{params, Connection, Result};
use std::sync::{Arc, Mutex};
use chrono::Utc;

pub struct NotesService {
    db: Arc<Mutex<Connection>>,
}

impl NotesService {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let service = Self {
            db: Arc::new(Mutex::new(conn)),
        };
        service.init_schema()?;
        service.insert_default_categories()?;
        Ok(service)
    }

    fn init_schema(&self) -> Result<()> {
        let db = self.db.lock().unwrap();
        
        db.execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL CHECK(type IN ('note', 'task', 'checklist')),
                title TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                markdown TEXT,
                tags TEXT,
                category_id TEXT,
                priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
                status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'archived', 'deleted')),
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                color TEXT,
                pinned INTEGER NOT NULL DEFAULT 0,
                favorite INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )",
            [],
        )?;

        db.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                note_id TEXT PRIMARY KEY,
                task_status TEXT NOT NULL CHECK(task_status IN ('todo', 'in-progress', 'completed', 'cancelled')),
                due_date INTEGER,
                estimated_time INTEGER,
                actual_time INTEGER,
                completed_at INTEGER,
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
            )",
            [],
        )?;

        db.execute(
            "CREATE TABLE IF NOT EXISTS subtasks (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                title TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                completed_at INTEGER,
                position INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (task_id) REFERENCES tasks(note_id) ON DELETE CASCADE
            )",
            [],
        )?;

        db.execute(
            "CREATE TABLE IF NOT EXISTS checklist_items (
                id TEXT PRIMARY KEY,
                note_id TEXT NOT NULL,
                text TEXT NOT NULL,
                completed INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                completed_at INTEGER,
                position INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
            )",
            [],
        )?;

        db.execute(
            "CREATE TABLE IF NOT EXISTS reminders (
                id TEXT PRIMARY KEY,
                note_id TEXT NOT NULL,
                date INTEGER NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                repeat TEXT NOT NULL CHECK(repeat IN ('none', 'daily', 'weekly', 'monthly')),
                repeat_until INTEGER,
                notified INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
            )",
            [],
        )?;

        db.execute(
            "CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                color TEXT NOT NULL,
                icon TEXT,
                position INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Create indexes
        db.execute("CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type)", [])?;
        db.execute("CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status)", [])?;
        db.execute("CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category_id)", [])?;
        db.execute("CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC)", [])?;
        db.execute("CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC)", [])?;
        db.execute("CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)", [])?;
        db.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(task_status)", [])?;
        db.execute("CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id)", [])?;
        db.execute("CREATE INDEX IF NOT EXISTS idx_checklist_note ON checklist_items(note_id)", [])?;
        db.execute("CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(date)", [])?;
        db.execute("CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON reminders(enabled)", [])?;

        Ok(())
    }

    fn insert_default_categories(&self) -> Result<()> {
        let db = self.db.lock().unwrap();
        let now = Utc::now().timestamp();

        let defaults = vec![
            ("personal", "Personal", "#3b82f6", "👤"),
            ("work", "Work", "#8b5cf6", "💼"),
            ("projects", "Projects", "#10b981", "🚀"),
            ("ideas", "Ideas", "#f59e0b", "💡"),
            ("shopping", "Shopping", "#ef4444", "🛒"),
        ];

        for (idx, (id, name, color, icon)) in defaults.iter().enumerate() {
            db.execute(
                "INSERT OR IGNORE INTO categories (id, name, color, icon, position, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![id, name, color, icon, idx as i32, now],
            )?;
        }

        Ok(())
    }

    // Get all notes
    pub fn get_all_notes(&self) -> Result<Vec<Note>> {
        let db = self.db.lock().unwrap();
        let mut stmt = db.prepare(
            "SELECT id, type, title, content, markdown, tags, category_id, priority, status, 
            created_at, updated_at, color, pinned, favorite 
            FROM notes WHERE status != 'deleted' ORDER BY updated_at DESC"
        )?;

        let notes = stmt.query_map([], |row| {
            let tags_str: String = row.get(5).unwrap_or_default();
            let tags: Vec<String> = if !tags_str.is_empty() {
                serde_json::from_str(&tags_str).unwrap_or_default()
            } else {
                vec![]
            };

            Ok(Note {
                id: row.get(0)?,
                note_type: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                markdown: row.get(4)?,
                tags,
                category: row.get(6)?,
                priority: row.get(7)?,
                status: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
                color: row.get(11)?,
                pinned: row.get::<_, i32>(12)? != 0,
                favorite: row.get::<_, i32>(13)? != 0,
                reminder: None,
                checklist: None,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

        Ok(notes)
    }

    // Create note
    pub fn create_note(&self, note: &Note) -> Result<()> {
        let db = self.db.lock().unwrap();
        let tags_json = serde_json::to_string(&note.tags).unwrap_or_default();

        db.execute(
            "INSERT INTO notes (id, type, title, content, markdown, tags, category_id, 
            priority, status, created_at, updated_at, color, pinned, favorite) 
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                &note.id,
                &note.note_type,
                &note.title,
                &note.content,
                &note.markdown,
                &tags_json,
                &note.category,
                &note.priority,
                &note.status,
                note.created_at,
                note.updated_at,
                &note.color,
                note.pinned as i32,
                note.favorite as i32,
            ],
        )?;

        // Insert reminder if exists
        if let Some(reminder) = &note.reminder {
            self.create_reminder(&note.id, reminder)?;
        }

        // Insert checklist if exists
        if let Some(checklist) = &note.checklist {
            for (i, item) in checklist.iter().enumerate() {
                self.create_checklist_item(&note.id, item, i as i32)?;
            }
        }

        Ok(())
    }

    // Update note
    pub fn update_note(&self, note: &Note) -> Result<()> {
        let db = self.db.lock().unwrap();
        let tags_json = serde_json::to_string(&note.tags).unwrap_or_default();

        db.execute(
            "UPDATE notes SET title = ?1, content = ?2, markdown = ?3, tags = ?4, 
            category_id = ?5, priority = ?6, status = ?7, updated_at = ?8, color = ?9, 
            pinned = ?10, favorite = ?11 WHERE id = ?12",
            params![
                &note.title,
                &note.content,
                &note.markdown,
                &tags_json,
                &note.category,
                &note.priority,
                &note.status,
                note.updated_at,
                &note.color,
                note.pinned as i32,
                note.favorite as i32,
                &note.id,
            ],
        )?;

        Ok(())
    }

    // Delete note (soft delete)
    pub fn delete_note(&self, note_id: &str) -> Result<()> {
        let db = self.db.lock().unwrap();
        let now = Utc::now().timestamp();

        db.execute(
            "UPDATE notes SET status = 'deleted', updated_at = ?1 WHERE id = ?2",
            params![now, note_id],
        )?;

        Ok(())
    }

    // Create task
    pub fn create_task(&self, task: &Task) -> Result<()> {
        // First create the note
        self.create_note(&task.note)?;

        let db = self.db.lock().unwrap();

        // Insert task-specific data
        db.execute(
            "INSERT INTO tasks (note_id, task_status, due_date, estimated_time, actual_time, completed_at) 
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                &task.note.id,
                &task.task_status,
                task.due_date,
                task.estimated_time,
                task.actual_time,
                task.completed_at,
            ],
        )?;

        // Insert subtasks if exists
        if let Some(subtasks) = &task.subtasks {
            for (i, subtask) in subtasks.iter().enumerate() {
                self.create_subtask(&task.note.id, subtask, i as i32)?;
            }
        }

        Ok(())
    }

    // Update task
    pub fn update_task(&self, task: &Task) -> Result<()> {
        // Update note data
        self.update_note(&task.note)?;

        let db = self.db.lock().unwrap();

        // Update task-specific data
        db.execute(
            "UPDATE tasks SET task_status = ?1, due_date = ?2, estimated_time = ?3, 
            actual_time = ?4, completed_at = ?5 WHERE note_id = ?6",
            params![
                &task.task_status,
                task.due_date,
                task.estimated_time,
                task.actual_time,
                task.completed_at,
                &task.note.id,
            ],
        )?;

        Ok(())
    }

    // Get all tasks
    pub fn get_all_tasks(&self) -> Result<Vec<Task>> {
        let db = self.db.lock().unwrap();
        let mut stmt = db.prepare(
            "SELECT n.id, n.type, n.title, n.content, n.markdown, n.tags, n.category_id, 
            n.priority, n.status, n.created_at, n.updated_at, n.color, n.pinned, n.favorite,
            t.task_status, t.due_date, t.estimated_time, t.actual_time, t.completed_at
            FROM notes n 
            JOIN tasks t ON n.id = t.note_id 
            WHERE n.status != 'deleted' 
            ORDER BY n.updated_at DESC"
        )?;

        let tasks = stmt.query_map([], |row| {
            let tags_str: String = row.get(5).unwrap_or_default();
            let tags: Vec<String> = if !tags_str.is_empty() {
                serde_json::from_str(&tags_str).unwrap_or_default()
            } else {
                vec![]
            };

            Ok(Task {
                note: Note {
                    id: row.get(0)?,
                    note_type: row.get(1)?,
                    title: row.get(2)?,
                    content: row.get(3)?,
                    markdown: row.get(4)?,
                    tags,
                    category: row.get(6)?,
                    priority: row.get(7)?,
                    status: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                    color: row.get(11)?,
                    pinned: row.get::<_, i32>(12)? != 0,
                    favorite: row.get::<_, i32>(13)? != 0,
                    reminder: None,
                    checklist: None,
                },
                task_status: row.get(14)?,
                due_date: row.get(15)?,
                estimated_time: row.get(16)?,
                actual_time: row.get(17)?,
                completed_at: row.get(18)?,
                subtasks: None,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

        Ok(tasks)
    }

    // Get all categories
    pub fn get_all_categories(&self) -> Result<Vec<Category>> {
        let db = self.db.lock().unwrap();
        let mut stmt = db.prepare("SELECT id, name, color, icon FROM categories ORDER BY position")?;

        let categories = stmt.query_map([], |row| {
            let id: String = row.get(0)?;
            let count = self.get_category_count(&id).unwrap_or(0);

            Ok(Category {
                id,
                name: row.get(1)?,
                color: row.get(2)?,
                icon: row.get(3)?,
                count,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

        Ok(categories)
    }

    fn get_category_count(&self, category_id: &str) -> Result<i32> {
        let db = self.db.lock().unwrap();
        let count: i32 = db.query_row(
            "SELECT COUNT(*) FROM notes WHERE category_id = ?1 AND status = 'active'",
            params![category_id],
            |row| row.get(0),
        )?;
        Ok(count)
    }

    // Helper methods
    fn create_reminder(&self, note_id: &str, reminder: &Reminder) -> Result<()> {
        let db = self.db.lock().unwrap();
        db.execute(
            "INSERT INTO reminders (id, note_id, date, enabled, repeat, repeat_until, notified) 
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                &reminder.id,
                note_id,
                reminder.date,
                reminder.enabled as i32,
                &reminder.repeat,
                reminder.repeat_until,
                reminder.notified as i32,
            ],
        )?;
        Ok(())
    }

    fn create_subtask(&self, task_id: &str, subtask: &Subtask, position: i32) -> Result<()> {
        let db = self.db.lock().unwrap();
        db.execute(
            "INSERT INTO subtasks (id, task_id, title, completed, created_at, completed_at, position) 
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                &subtask.id,
                task_id,
                &subtask.title,
                subtask.completed as i32,
                subtask.created_at,
                subtask.completed_at,
                position,
            ],
        )?;
        Ok(())
    }

    fn create_checklist_item(&self, note_id: &str, item: &ChecklistItem, position: i32) -> Result<()> {
        let db = self.db.lock().unwrap();
        db.execute(
            "INSERT INTO checklist_items (id, note_id, text, completed, created_at, completed_at, position) 
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                &item.id,
                note_id,
                &item.text,
                item.completed as i32,
                item.created_at,
                item.completed_at,
                position,
            ],
        )?;
        Ok(())
    }

    // Get statistics
    pub fn get_stats(&self) -> Result<NotesStats> {
        let db = self.db.lock().unwrap();
        
        let total_notes: i32 = db.query_row("SELECT COUNT(*) FROM notes WHERE status != 'deleted'", [], |row| row.get(0))?;
        let active_notes: i32 = db.query_row("SELECT COUNT(*) FROM notes WHERE status = 'active'", [], |row| row.get(0))?;
        let completed_notes: i32 = db.query_row("SELECT COUNT(*) FROM notes WHERE status = 'completed'", [], |row| row.get(0))?;
        let archived_notes: i32 = db.query_row("SELECT COUNT(*) FROM notes WHERE status = 'archived'", [], |row| row.get(0))?;
        let deleted_notes: i32 = db.query_row("SELECT COUNT(*) FROM notes WHERE status = 'deleted'", [], |row| row.get(0))?;
        
        let total_tasks: i32 = db.query_row("SELECT COUNT(*) FROM tasks t JOIN notes n ON t.note_id = n.id WHERE n.status != 'deleted'", [], |row| row.get(0))?;
        let active_tasks: i32 = db.query_row("SELECT COUNT(*) FROM tasks t JOIN notes n ON t.note_id = n.id WHERE n.status = 'active' AND t.task_status IN ('todo', 'in-progress')", [], |row| row.get(0))?;
        let completed_tasks: i32 = db.query_row("SELECT COUNT(*) FROM tasks t JOIN notes n ON t.note_id = n.id WHERE t.task_status = 'completed'", [], |row| row.get(0))?;
        
        let now = Utc::now().timestamp();
        let overdue_tasks: i32 = db.query_row("SELECT COUNT(*) FROM tasks t JOIN notes n ON t.note_id = n.id WHERE n.status = 'active' AND t.due_date < ?1 AND t.task_status NOT IN ('completed', 'cancelled')", params![now], |row| row.get(0))?;
        
        let today_start = Utc::now().date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc().timestamp();
        let today_end = today_start + 86400;
        let due_today: i32 = db.query_row("SELECT COUNT(*) FROM tasks t JOIN notes n ON t.note_id = n.id WHERE n.status = 'active' AND t.due_date >= ?1 AND t.due_date < ?2", params![today_start, today_end], |row| row.get(0))?;
        
        let week_end = today_start + (7 * 86400);
        let due_this_week: i32 = db.query_row("SELECT COUNT(*) FROM tasks t JOIN notes n ON t.note_id = n.id WHERE n.status = 'active' AND t.due_date >= ?1 AND t.due_date < ?2", params![today_start, week_end], |row| row.get(0))?;

        Ok(NotesStats {
            total_notes,
            active_notes,
            completed_notes,
            archived_notes,
            deleted_notes,
            total_tasks,
            active_tasks,
            completed_tasks,
            overdue_tasks,
            due_today,
            due_this_week,
        })
    }
}
