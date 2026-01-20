use crate::models::reading_list::{Article, ArticleStats, ArticleFilter};
use log::info;
use rusqlite::{params, Connection, Result as SqliteResult};
use std::sync::{Arc, Mutex};

pub struct ReadingListService {
    conn: Arc<Mutex<Connection>>,
}

impl ReadingListService {
    pub fn new(db_path: &str) -> Result<Self, String> {
        let conn = Connection::open(db_path)
            .map_err(|e| format!("Failed to open reading list database: {}", e))?;
        
        let service = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        
        service.init_database()?;
        info!("📚 Reading List Service initialized");
        
        Ok(service)
    }
    
    fn init_database(&self) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS articles (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                author TEXT,
                excerpt TEXT,
                content TEXT,
                thumbnail TEXT,
                tags TEXT NOT NULL DEFAULT '[]',
                reading_time_minutes INTEGER,
                progress_percentage REAL NOT NULL DEFAULT 0.0,
                is_read INTEGER NOT NULL DEFAULT 0,
                is_favorite INTEGER NOT NULL DEFAULT 0,
                added_at INTEGER NOT NULL,
                read_at INTEGER,
                last_opened_at INTEGER
            )",
            [],
        ).map_err(|e| format!("Failed to create articles table: {}", e))?;
        
        // Create indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_articles_is_read ON articles(is_read)",
            [],
        ).map_err(|e| format!("Failed to create index: {}", e))?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_articles_is_favorite ON articles(is_favorite)",
            [],
        ).map_err(|e| format!("Failed to create index: {}", e))?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_articles_added_at ON articles(added_at DESC)",
            [],
        ).map_err(|e| format!("Failed to create index: {}", e))?;
        
        Ok(())
    }
    
    pub fn get_all_articles(&self) -> Result<Vec<Article>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let mut stmt = conn.prepare(
            "SELECT id, url, title, author, excerpt, content, thumbnail, tags,
                    reading_time_minutes, progress_percentage, is_read, is_favorite,
                    added_at, read_at, last_opened_at
             FROM articles
             ORDER BY added_at DESC"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let articles = stmt.query_map([], |row| {
            let tags_json: String = row.get(7)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            
            Ok(Article {
                id: row.get(0)?,
                url: row.get(1)?,
                title: row.get(2)?,
                author: row.get(3)?,
                excerpt: row.get(4)?,
                content: row.get(5)?,
                thumbnail: row.get(6)?,
                tags,
                reading_time_minutes: row.get(8)?,
                progress_percentage: row.get(9)?,
                is_read: row.get::<_, i32>(10)? != 0,
                is_favorite: row.get::<_, i32>(11)? != 0,
                added_at: row.get(12)?,
                read_at: row.get(13)?,
                last_opened_at: row.get(14)?,
            })
        }).map_err(|e| format!("Failed to query articles: {}", e))?
        .collect::<SqliteResult<Vec<_>>>()
        .map_err(|e| format!("Failed to collect articles: {}", e))?;
        
        Ok(articles)
    }
    
    pub fn get_article(&self, id: &str) -> Result<Option<Article>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let mut stmt = conn.prepare(
            "SELECT id, url, title, author, excerpt, content, thumbnail, tags,
                    reading_time_minutes, progress_percentage, is_read, is_favorite,
                    added_at, read_at, last_opened_at
             FROM articles WHERE id = ?"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let result = stmt.query_row([id], |row| {
            let tags_json: String = row.get(7)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            
            Ok(Article {
                id: row.get(0)?,
                url: row.get(1)?,
                title: row.get(2)?,
                author: row.get(3)?,
                excerpt: row.get(4)?,
                content: row.get(5)?,
                thumbnail: row.get(6)?,
                tags,
                reading_time_minutes: row.get(8)?,
                progress_percentage: row.get(9)?,
                is_read: row.get::<_, i32>(10)? != 0,
                is_favorite: row.get::<_, i32>(11)? != 0,
                added_at: row.get(12)?,
                read_at: row.get(13)?,
                last_opened_at: row.get(14)?,
            })
        });
        
        match result {
            Ok(article) => Ok(Some(article)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("Failed to get article: {}", e)),
        }
    }
    
    pub fn add_article(&self, article: &Article) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let tags_json = serde_json::to_string(&article.tags)
            .map_err(|e| format!("Failed to serialize tags: {}", e))?;
        
        conn.execute(
            "INSERT INTO articles (id, url, title, author, excerpt, content, thumbnail, tags,
                                  reading_time_minutes, progress_percentage, is_read, is_favorite,
                                  added_at, read_at, last_opened_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                article.id,
                article.url,
                article.title,
                article.author,
                article.excerpt,
                article.content,
                article.thumbnail,
                tags_json,
                article.reading_time_minutes,
                article.progress_percentage,
                article.is_read as i32,
                article.is_favorite as i32,
                article.added_at,
                article.read_at,
                article.last_opened_at,
            ],
        ).map_err(|e| format!("Failed to insert article: {}", e))?;
        
        Ok(())
    }
    
    pub fn update_article(&self, article: &Article) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let tags_json = serde_json::to_string(&article.tags)
            .map_err(|e| format!("Failed to serialize tags: {}", e))?;
        
        conn.execute(
            "UPDATE articles SET url = ?, title = ?, author = ?, excerpt = ?, content = ?,
                                thumbnail = ?, tags = ?, reading_time_minutes = ?,
                                progress_percentage = ?, is_read = ?, is_favorite = ?,
                                read_at = ?, last_opened_at = ?
             WHERE id = ?",
            params![
                article.url,
                article.title,
                article.author,
                article.excerpt,
                article.content,
                article.thumbnail,
                tags_json,
                article.reading_time_minutes,
                article.progress_percentage,
                article.is_read as i32,
                article.is_favorite as i32,
                article.read_at,
                article.last_opened_at,
                article.id,
            ],
        ).map_err(|e| format!("Failed to update article: {}", e))?;
        
        Ok(())
    }
    
    pub fn delete_article(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute("DELETE FROM articles WHERE id = ?", [id])
            .map_err(|e| format!("Failed to delete article: {}", e))?;
        
        Ok(())
    }
    
    pub fn mark_as_read(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let now = chrono::Utc::now().timestamp();
        
        conn.execute(
            "UPDATE articles SET is_read = 1, read_at = ?, progress_percentage = 100.0
             WHERE id = ?",
            params![now, id],
        ).map_err(|e| format!("Failed to mark article as read: {}", e))?;
        
        Ok(())
    }
    
    pub fn mark_as_unread(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "UPDATE articles SET is_read = 0, read_at = NULL
             WHERE id = ?",
            [id],
        ).map_err(|e| format!("Failed to mark article as unread: {}", e))?;
        
        Ok(())
    }
    
    pub fn update_progress(&self, id: &str, progress: f32) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let now = chrono::Utc::now().timestamp();
        
        // If progress reaches 100%, mark as read
        let (is_read, read_at) = if progress >= 100.0 {
            (1, Some(now))
        } else {
            (0, None)
        };
        
        conn.execute(
            "UPDATE articles SET progress_percentage = ?, is_read = ?, read_at = ?, last_opened_at = ?
             WHERE id = ?",
            params![progress, is_read, read_at, now, id],
        ).map_err(|e| format!("Failed to update progress: {}", e))?;
        
        Ok(())
    }
    
    pub fn toggle_favorite(&self, id: &str) -> Result<bool, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let current: i32 = conn.query_row(
            "SELECT is_favorite FROM articles WHERE id = ?",
            [id],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to get favorite status: {}", e))?;
        
        let new_value = if current == 0 { 1 } else { 0 };
        
        conn.execute(
            "UPDATE articles SET is_favorite = ? WHERE id = ?",
            params![new_value, id],
        ).map_err(|e| format!("Failed to toggle favorite: {}", e))?;
        
        Ok(new_value == 1)
    }
    
    pub fn search_articles(&self, filter: &ArticleFilter) -> Result<Vec<Article>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let mut query = String::from(
            "SELECT id, url, title, author, excerpt, content, thumbnail, tags,
                    reading_time_minutes, progress_percentage, is_read, is_favorite,
                    added_at, read_at, last_opened_at
             FROM articles WHERE 1=1"
        );
        
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(status) = &filter.status {
            match status.as_str() {
                "read" => query.push_str(" AND is_read = 1"),
                "unread" => query.push_str(" AND is_read = 0"),
                _ => {}
            }
        }
        
        if filter.favorites_only {
            query.push_str(" AND is_favorite = 1");
        }
        
        if let Some(tag) = &filter.tag {
            query.push_str(" AND tags LIKE ?");
            params.push(Box::new(format!("%\"{}\":%", tag)));
        }
        
        if let Some(search) = &filter.search_query {
            query.push_str(" AND (title LIKE ? OR author LIKE ? OR excerpt LIKE ? OR content LIKE ?)");
            let search_pattern = format!("%{}%", search);
            params.push(Box::new(search_pattern.clone()));
            params.push(Box::new(search_pattern.clone()));
            params.push(Box::new(search_pattern.clone()));
            params.push(Box::new(search_pattern));
        }
        
        query.push_str(" ORDER BY added_at DESC");
        
        let mut stmt = conn.prepare(&query)
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        
        let articles = stmt.query_map(param_refs.as_slice(), |row| {
            let tags_json: String = row.get(7)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            
            Ok(Article {
                id: row.get(0)?,
                url: row.get(1)?,
                title: row.get(2)?,
                author: row.get(3)?,
                excerpt: row.get(4)?,
                content: row.get(5)?,
                thumbnail: row.get(6)?,
                tags,
                reading_time_minutes: row.get(8)?,
                progress_percentage: row.get(9)?,
                is_read: row.get::<_, i32>(10)? != 0,
                is_favorite: row.get::<_, i32>(11)? != 0,
                added_at: row.get(12)?,
                read_at: row.get(13)?,
                last_opened_at: row.get(14)?,
            })
        }).map_err(|e| format!("Failed to query articles: {}", e))?
        .collect::<SqliteResult<Vec<_>>>()
        .map_err(|e| format!("Failed to collect articles: {}", e))?;
        
        Ok(articles)
    }
    
    pub fn get_stats(&self) -> Result<ArticleStats, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let total_articles: i32 = conn.query_row(
            "SELECT COUNT(*) FROM articles",
            [],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to get total articles: {}", e))?;
        
        let unread_articles: i32 = conn.query_row(
            "SELECT COUNT(*) FROM articles WHERE is_read = 0",
            [],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to get unread articles: {}", e))?;
        
        let read_articles: i32 = conn.query_row(
            "SELECT COUNT(*) FROM articles WHERE is_read = 1",
            [],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to get read articles: {}", e))?;
        
        let favorite_articles: i32 = conn.query_row(
            "SELECT COUNT(*) FROM articles WHERE is_favorite = 1",
            [],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to get favorite articles: {}", e))?;
        
        let total_reading_time_minutes: i32 = conn.query_row(
            "SELECT COALESCE(SUM(reading_time_minutes), 0) FROM articles",
            [],
            |row| row.get(0),
        ).map_err(|e| format!("Failed to get total reading time: {}", e))?;
        
        Ok(ArticleStats {
            total_articles,
            unread_articles,
            read_articles,
            favorite_articles,
            total_reading_time_minutes,
        })
    }
    
    pub fn get_all_tags(&self) -> Result<Vec<String>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let mut stmt = conn.prepare("SELECT DISTINCT tags FROM articles")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let tags_sets = stmt.query_map([], |row| {
            let tags_json: String = row.get(0)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            Ok(tags)
        }).map_err(|e| format!("Failed to query tags: {}", e))?
        .collect::<SqliteResult<Vec<_>>>()
        .map_err(|e| format!("Failed to collect tags: {}", e))?;
        
        let mut all_tags: Vec<String> = tags_sets.into_iter().flatten().collect();
        all_tags.sort();
        all_tags.dedup();
        
        Ok(all_tags)
    }
}
