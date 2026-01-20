// Notes & Tasks Models
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    #[serde(rename = "type")]
    pub note_type: String,
    pub title: String,
    pub content: String,
    pub markdown: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub category: Option<String>,
    pub priority: String,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub color: Option<String>,
    pub pinned: bool,
    pub favorite: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reminder: Option<Reminder>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checklist: Option<Vec<ChecklistItem>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    #[serde(flatten)]
    pub note: Note,
    pub task_status: String,
    pub due_date: Option<i64>,
    pub estimated_time: Option<i32>,
    pub actual_time: Option<i32>,
    pub completed_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subtasks: Option<Vec<Subtask>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subtask {
    pub id: String,
    pub title: String,
    pub completed: bool,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChecklistItem {
    pub id: String,
    pub text: String,
    pub completed: bool,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reminder {
    pub id: String,
    pub date: i64,
    pub enabled: bool,
    pub repeat: String,
    pub repeat_until: Option<i64>,
    pub notified: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: Option<String>,
    pub count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteFilter {
    pub note_type: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub categories: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub search: Option<String>,
    pub has_reminder: Option<bool>,
    pub pinned_only: Option<bool>,
    pub favorite_only: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotesStats {
    pub total_notes: i32,
    pub active_notes: i32,
    pub completed_notes: i32,
    pub archived_notes: i32,
    pub deleted_notes: i32,
    pub total_tasks: i32,
    pub active_tasks: i32,
    pub completed_tasks: i32,
    pub overdue_tasks: i32,
    pub due_today: i32,
    pub due_this_week: i32,
}
