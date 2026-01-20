// Collections Service - Hierarchical bookmarks and page collections
use crate::models::collections::*;
use rusqlite::{params, Connection, Result as SqlResult};
use std::sync::{Arc, Mutex};

pub struct CollectionsService {
    conn: Arc<Mutex<Connection>>,
}

impl CollectionsService {
    /// Create a new CollectionsService with the given database path
    pub fn new(db_path: &str) -> SqlResult<Self> {
        let conn = Connection::open(db_path)?;
        let service = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        // Initialize schema
        service.init_schema()?;
        service.insert_default_collections(&service.conn.lock().unwrap())?;
        
        println!("📚 Collections Service initialized successfully");

        Ok(service)
    }

    /// Initialize the database schema
    fn init_schema(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();

        // Collections table - hierarchical folders
        conn.execute(
            "CREATE TABLE IF NOT EXISTS collections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT NOT NULL,
                color TEXT NOT NULL,
                parent_id TEXT,
                page_count INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                is_shared BOOLEAN DEFAULT 0,
                is_favorite BOOLEAN DEFAULT 0,
                position INTEGER DEFAULT 0,
                FOREIGN KEY (parent_id) REFERENCES collections(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Collection pages table - bookmarked pages
        conn.execute(
            "CREATE TABLE IF NOT EXISTS collection_pages (
                id TEXT PRIMARY KEY,
                collection_id TEXT NOT NULL,
                url TEXT NOT NULL,
                title TEXT NOT NULL,
                screenshot TEXT,
                notes TEXT,
                tags TEXT NOT NULL DEFAULT '[]',
                added_at INTEGER NOT NULL,
                last_visited INTEGER,
                visit_count INTEGER DEFAULT 0,
                position INTEGER DEFAULT 0,
                is_favorite BOOLEAN DEFAULT 0,
                FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Collection shares table - for shared collections
        conn.execute(
            "CREATE TABLE IF NOT EXISTS collection_shares (
                id TEXT PRIMARY KEY,
                collection_id TEXT NOT NULL,
                share_token TEXT NOT NULL UNIQUE,
                password TEXT,
                expires_at INTEGER,
                created_at INTEGER NOT NULL,
                view_count INTEGER DEFAULT 0,
                max_views INTEGER,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Performance indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_collections_parent ON collections(parent_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_collections_favorite ON collections(is_favorite)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_collections_position ON collections(position)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_pages_collection ON collection_pages(collection_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_pages_url ON collection_pages(url)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_pages_position ON collection_pages(position)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_pages_favorite ON collection_pages(is_favorite)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_shares_token ON collection_shares(share_token)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_shares_collection ON collection_shares(collection_id)",
            [],
        )?;

        // Insert default collections if none exist
        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM collections",
            [],
            |row| row.get(0),
        )?;

        if count == 0 {
            self.insert_default_collections(&conn)?;
        }

        Ok(())
    }

    /// Insert default collections
    fn insert_default_collections(&self, conn: &Connection) -> SqlResult<()> {
        let now = chrono::Utc::now().timestamp();
        let defaults = vec![
            ("default_1", "Bookmarks", "My saved bookmarks", "🔖", "#3B82F6", 0),
            ("default_2", "Reading List", "Articles to read", "📖", "#10B981", 1),
            ("default_3", "Work", "Work-related pages", "💼", "#8B5CF6", 2),
            ("default_4", "Research", "Research materials", "🔬", "#F59E0B", 3),
            ("default_5", "Inspiration", "Design inspiration", "✨", "#EC4899", 4),
        ];

        for (id, name, desc, icon, color, position) in defaults {
            conn.execute(
                "INSERT OR IGNORE INTO collections (id, name, description, icon, color, parent_id, page_count, created_at, updated_at, is_shared, is_favorite, position)
                 VALUES (?, ?, ?, ?, ?, NULL, 0, ?, ?, 0, 0, ?)",
                params![id, name, desc, icon, color, now, now, position],
            )?;
        }

        println!("✅ Inserted 5 default collections");
        Ok(())
    }

    // ========================================================================
    // COLLECTION CRUD OPERATIONS
    // ========================================================================

    /// Get all collections (hierarchical structure maintained via parent_id)
    pub fn get_all_collections(&self) -> SqlResult<Vec<Collection>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, parent_id, page_count, 
                    created_at, updated_at, is_shared, is_favorite
             FROM collections
             ORDER BY position ASC, created_at DESC",
        )?;

        let collections = stmt.query_map([], |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                parent_id: row.get(5)?,
                page_count: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                is_shared: row.get(9)?,
                is_favorite: row.get(10)?,
            })
        })?;

        collections.collect()
    }

    /// Get a specific collection by ID
    pub fn get_collection(&self, id: &str) -> SqlResult<Option<Collection>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, parent_id, page_count,
                    created_at, updated_at, is_shared, is_favorite
             FROM collections
             WHERE id = ?",
        )?;

        let result = stmt.query_row([id], |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                parent_id: row.get(5)?,
                page_count: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                is_shared: row.get(9)?,
                is_favorite: row.get(10)?,
            })
        });

        match result {
            Ok(collection) => Ok(Some(collection)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get child collections (one level deep)
    pub fn get_child_collections(&self, parent_id: &str) -> SqlResult<Vec<Collection>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, parent_id, page_count,
                    created_at, updated_at, is_shared, is_favorite
             FROM collections
             WHERE parent_id = ?
             ORDER BY position ASC, created_at DESC",
        )?;

        let collections = stmt.query_map([parent_id], |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                parent_id: row.get(5)?,
                page_count: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                is_shared: row.get(9)?,
                is_favorite: row.get(10)?,
            })
        })?;

        collections.collect()
    }

    /// Get root collections (no parent)
    pub fn get_root_collections(&self) -> SqlResult<Vec<Collection>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, parent_id, page_count,
                    created_at, updated_at, is_shared, is_favorite
             FROM collections
             WHERE parent_id IS NULL
             ORDER BY position ASC, created_at DESC",
        )?;

        let collections = stmt.query_map([], |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                parent_id: row.get(5)?,
                page_count: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                is_shared: row.get(9)?,
                is_favorite: row.get(10)?,
            })
        })?;

        collections.collect()
    }

    /// Create a new collection
    pub fn create_collection(&self, collection: &Collection) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO collections (id, name, description, icon, color, parent_id, page_count, 
                                     created_at, updated_at, is_shared, is_favorite, position)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                collection.id,
                collection.name,
                collection.description,
                collection.icon,
                collection.color,
                collection.parent_id,
                collection.page_count,
                collection.created_at,
                collection.updated_at,
                collection.is_shared,
                collection.is_favorite,
                0, // Default position
            ],
        )?;
        Ok(())
    }

    /// Update a collection
    pub fn update_collection(&self, collection: &Collection) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE collections 
             SET name = ?, description = ?, icon = ?, color = ?, parent_id = ?,
                 updated_at = ?, is_shared = ?, is_favorite = ?
             WHERE id = ?",
            params![
                collection.name,
                collection.description,
                collection.icon,
                collection.color,
                collection.parent_id,
                collection.updated_at,
                collection.is_shared,
                collection.is_favorite,
                collection.id,
            ],
        )?;
        Ok(())
    }

    /// Delete a collection (cascade deletes pages and subfolders)
    pub fn delete_collection(&self, id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM collections WHERE id = ?", [id])?;
        Ok(())
    }

    /// Move collection to different parent (or root if None)
    pub fn move_collection(&self, id: &str, new_parent_id: Option<String>) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Utc::now().timestamp();
        
        conn.execute(
            "UPDATE collections SET parent_id = ?, updated_at = ? WHERE id = ?",
            params![new_parent_id, now, id],
        )?;
        Ok(())
    }

    /// Update collection position (for drag-and-drop reordering)
    pub fn update_collection_position(&self, id: &str, position: i32) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE collections SET position = ? WHERE id = ?",
            params![position, id],
        )?;
        Ok(())
    }

    // ========================================================================
    // PAGE CRUD OPERATIONS
    // ========================================================================

    /// Get all pages in a collection
    pub fn get_collection_pages(&self, collection_id: &str) -> SqlResult<Vec<CollectionPage>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, collection_id, url, title, screenshot, notes, tags,
                    added_at, last_visited, visit_count, is_favorite
             FROM collection_pages
             WHERE collection_id = ?
             ORDER BY position ASC, added_at DESC",
        )?;

        let pages = stmt.query_map([collection_id], |row| {
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(CollectionPage {
                id: row.get(0)?,
                collection_id: row.get(1)?,
                url: row.get(2)?,
                title: row.get(3)?,
                screenshot: row.get(4)?,
                notes: row.get(5)?,
                tags,
                added_at: row.get(7)?,
                last_visited: row.get(8)?,
                visit_count: row.get(9)?,
                is_favorite: row.get(10)?,
            })
        })?;

        pages.collect()
    }

    /// Get a specific page by ID
    pub fn get_page(&self, id: &str) -> SqlResult<Option<CollectionPage>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, collection_id, url, title, screenshot, notes, tags,
                    added_at, last_visited, visit_count, is_favorite
             FROM collection_pages
             WHERE id = ?",
        )?;

        let result = stmt.query_row([id], |row| {
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(CollectionPage {
                id: row.get(0)?,
                collection_id: row.get(1)?,
                url: row.get(2)?,
                title: row.get(3)?,
                screenshot: row.get(4)?,
                notes: row.get(5)?,
                tags,
                added_at: row.get(7)?,
                last_visited: row.get(8)?,
                visit_count: row.get(9)?,
                is_favorite: row.get(10)?,
            })
        });

        match result {
            Ok(page) => Ok(Some(page)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Add a page to a collection
    pub fn add_page(&self, page: &CollectionPage) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let tags_json = serde_json::to_string(&page.tags).unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "INSERT INTO collection_pages (id, collection_id, url, title, screenshot, notes, tags,
                                          added_at, last_visited, visit_count, position, is_favorite)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                page.id,
                page.collection_id,
                page.url,
                page.title,
                page.screenshot,
                page.notes,
                tags_json,
                page.added_at,
                page.last_visited,
                page.visit_count,
                0, // Default position
                page.is_favorite,
            ],
        )?;

        // Update page count in collection
        conn.execute(
            "UPDATE collections SET page_count = page_count + 1, updated_at = ? WHERE id = ?",
            params![chrono::Utc::now().timestamp(), page.collection_id],
        )?;

        Ok(())
    }

    /// Update a page
    pub fn update_page(&self, page: &CollectionPage) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let tags_json = serde_json::to_string(&page.tags).unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "UPDATE collection_pages
             SET title = ?, screenshot = ?, notes = ?, tags = ?,
                 last_visited = ?, visit_count = ?, is_favorite = ?
             WHERE id = ?",
            params![
                page.title,
                page.screenshot,
                page.notes,
                tags_json,
                page.last_visited,
                page.visit_count,
                page.is_favorite,
                page.id,
            ],
        )?;

        // Update collection's updated_at
        conn.execute(
            "UPDATE collections SET updated_at = ? WHERE id = ?",
            params![chrono::Utc::now().timestamp(), page.collection_id],
        )?;

        Ok(())
    }

    /// Delete a page
    pub fn delete_page(&self, id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        
        // Get collection_id before deleting
        let collection_id: String = conn.query_row(
            "SELECT collection_id FROM collection_pages WHERE id = ?",
            [id],
            |row| row.get(0),
        )?;

        conn.execute("DELETE FROM collection_pages WHERE id = ?", [id])?;

        // Update page count
        conn.execute(
            "UPDATE collections SET page_count = page_count - 1, updated_at = ? WHERE id = ?",
            params![chrono::Utc::now().timestamp(), collection_id],
        )?;

        Ok(())
    }

    /// Move page to different collection
    pub fn move_page(&self, page_id: &str, new_collection_id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Utc::now().timestamp();

        // Get old collection_id
        let old_collection_id: String = conn.query_row(
            "SELECT collection_id FROM collection_pages WHERE id = ?",
            [page_id],
            |row| row.get(0),
        )?;

        // Update page's collection
        conn.execute(
            "UPDATE collection_pages SET collection_id = ? WHERE id = ?",
            params![new_collection_id, page_id],
        )?;

        // Update page counts
        conn.execute(
            "UPDATE collections SET page_count = page_count - 1, updated_at = ? WHERE id = ?",
            params![now, old_collection_id],
        )?;
        conn.execute(
            "UPDATE collections SET page_count = page_count + 1, updated_at = ? WHERE id = ?",
            params![now, new_collection_id],
        )?;

        Ok(())
    }

    /// Update page position (for drag-and-drop reordering)
    pub fn update_page_position(&self, id: &str, position: i32) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE collection_pages SET position = ? WHERE id = ?",
            params![position, id],
        )?;
        Ok(())
    }

    /// Update page visit tracking
    pub fn track_page_visit(&self, id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Utc::now().timestamp();

        conn.execute(
            "UPDATE collection_pages 
             SET last_visited = ?, visit_count = visit_count + 1
             WHERE id = ?",
            params![now, id],
        )?;

        Ok(())
    }

    // ========================================================================
    // SHARING OPERATIONS
    // ========================================================================

    /// Create a share link for a collection
    pub fn create_share(&self, share: &CollectionShare) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO collection_shares (id, collection_id, share_token, password, expires_at,
                                           created_at, view_count, max_views, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                share.id,
                share.collection_id,
                share.share_token,
                share.password,
                share.expires_at,
                share.created_at,
                share.view_count,
                share.max_views,
                share.is_active,
            ],
        )?;

        // Mark collection as shared
        conn.execute(
            "UPDATE collections SET is_shared = 1 WHERE id = ?",
            [&share.collection_id],
        )?;

        Ok(())
    }

    /// Get share by token
    pub fn get_share_by_token(&self, token: &str) -> SqlResult<Option<CollectionShare>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, collection_id, share_token, password, expires_at,
                    created_at, view_count, max_views, is_active
             FROM collection_shares
             WHERE share_token = ?",
        )?;

        let result = stmt.query_row([token], |row| {
            Ok(CollectionShare {
                id: row.get(0)?,
                collection_id: row.get(1)?,
                share_token: row.get(2)?,
                password: row.get(3)?,
                expires_at: row.get(4)?,
                created_at: row.get(5)?,
                view_count: row.get(6)?,
                max_views: row.get(7)?,
                is_active: row.get(8)?,
            })
        });

        match result {
            Ok(share) => Ok(Some(share)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get all shares for a collection
    pub fn get_collection_shares(&self, collection_id: &str) -> SqlResult<Vec<CollectionShare>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, collection_id, share_token, password, expires_at,
                    created_at, view_count, max_views, is_active
             FROM collection_shares
             WHERE collection_id = ?
             ORDER BY created_at DESC",
        )?;

        let shares = stmt.query_map([collection_id], |row| {
            Ok(CollectionShare {
                id: row.get(0)?,
                collection_id: row.get(1)?,
                share_token: row.get(2)?,
                password: row.get(3)?,
                expires_at: row.get(4)?,
                created_at: row.get(5)?,
                view_count: row.get(6)?,
                max_views: row.get(7)?,
                is_active: row.get(8)?,
            })
        })?;

        shares.collect()
    }

    /// Increment share view count
    pub fn increment_share_views(&self, share_id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE collection_shares SET view_count = view_count + 1 WHERE id = ?",
            [share_id],
        )?;
        Ok(())
    }

    /// Revoke a share (deactivate)
    pub fn revoke_share(&self, share_id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE collection_shares SET is_active = 0 WHERE id = ?",
            [share_id],
        )?;
        Ok(())
    }

    /// Delete a share
    pub fn delete_share(&self, share_id: &str) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        
        // Get collection_id and check if it's the last share
        let (collection_id, share_count): (String, i32) = conn.query_row(
            "SELECT collection_id, (SELECT COUNT(*) FROM collection_shares WHERE collection_id = cs.collection_id) as cnt
             FROM collection_shares cs WHERE id = ?",
            [share_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )?;

        conn.execute("DELETE FROM collection_shares WHERE id = ?", [share_id])?;

        // If no more shares, mark collection as not shared
        if share_count <= 1 {
            conn.execute(
                "UPDATE collections SET is_shared = 0 WHERE id = ?",
                [collection_id],
            )?;
        }

        Ok(())
    }

    // ========================================================================
    // STATISTICS & SEARCH
    // ========================================================================

    /// Get collection statistics
    pub fn get_stats(&self) -> SqlResult<CollectionStats> {
        let conn = self.conn.lock().unwrap();

        let total_collections: i32 = conn.query_row(
            "SELECT COUNT(*) FROM collections",
            [],
            |row| row.get(0),
        )?;

        let total_pages: i32 = conn.query_row(
            "SELECT COUNT(*) FROM collection_pages",
            [],
            |row| row.get(0),
        )?;

        let shared_collections: i32 = conn.query_row(
            "SELECT COUNT(*) FROM collections WHERE is_shared = 1",
            [],
            |row| row.get(0),
        )?;

        let favorite_collections: i32 = conn.query_row(
            "SELECT COUNT(*) FROM collections WHERE is_favorite = 1",
            [],
            |row| row.get(0),
        )?;

        let favorite_pages: i32 = conn.query_row(
            "SELECT COUNT(*) FROM collection_pages WHERE is_favorite = 1",
            [],
            |row| row.get(0),
        )?;

        Ok(CollectionStats {
            total_collections,
            total_pages,
            shared_collections,
            favorite_collections,
            favorite_pages,
        })
    }

    /// Search pages across all collections
    pub fn search_pages(&self, query: &str) -> SqlResult<Vec<CollectionPage>> {
        let conn = self.conn.lock().unwrap();
        let search_pattern = format!("%{}%", query.to_lowercase());

        let mut stmt = conn.prepare(
            "SELECT id, collection_id, url, title, screenshot, notes, tags,
                    added_at, last_visited, visit_count, is_favorite
             FROM collection_pages
             WHERE LOWER(title) LIKE ?1 
                OR LOWER(url) LIKE ?1 
                OR LOWER(notes) LIKE ?1
             ORDER BY visit_count DESC, added_at DESC
             LIMIT 100",
        )?;

        let pages = stmt.query_map([&search_pattern], |row| {
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(CollectionPage {
                id: row.get(0)?,
                collection_id: row.get(1)?,
                url: row.get(2)?,
                title: row.get(3)?,
                screenshot: row.get(4)?,
                notes: row.get(5)?,
                tags,
                added_at: row.get(7)?,
                last_visited: row.get(8)?,
                visit_count: row.get(9)?,
                is_favorite: row.get(10)?,
            })
        })?;

        pages.collect()
    }

    /// Get favorite collections
    pub fn get_favorite_collections(&self) -> SqlResult<Vec<Collection>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, parent_id, page_count,
                    created_at, updated_at, is_shared, is_favorite
             FROM collections
             WHERE is_favorite = 1
             ORDER BY updated_at DESC",
        )?;

        let collections = stmt.query_map([], |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                parent_id: row.get(5)?,
                page_count: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                is_shared: row.get(9)?,
                is_favorite: row.get(10)?,
            })
        })?;

        collections.collect()
    }

    /// Get favorite pages across all collections
    pub fn get_favorite_pages(&self) -> SqlResult<Vec<CollectionPage>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, collection_id, url, title, screenshot, notes, tags,
                    added_at, last_visited, visit_count, is_favorite
             FROM collection_pages
             WHERE is_favorite = 1
             ORDER BY last_visited DESC",
        )?;

        let pages = stmt.query_map([], |row| {
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(CollectionPage {
                id: row.get(0)?,
                collection_id: row.get(1)?,
                url: row.get(2)?,
                title: row.get(3)?,
                screenshot: row.get(4)?,
                notes: row.get(5)?,
                tags,
                added_at: row.get(7)?,
                last_visited: row.get(8)?,
                visit_count: row.get(9)?,
                is_favorite: row.get(10)?,
            })
        })?;

        pages.collect()
    }

    /// Get recently visited pages
    pub fn get_recent_pages(&self, limit: i32) -> SqlResult<Vec<CollectionPage>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, collection_id, url, title, screenshot, notes, tags,
                    added_at, last_visited, visit_count, is_favorite
             FROM collection_pages
             WHERE last_visited IS NOT NULL
             ORDER BY last_visited DESC
             LIMIT ?",
        )?;

        let pages = stmt.query_map([limit], |row| {
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(CollectionPage {
                id: row.get(0)?,
                collection_id: row.get(1)?,
                url: row.get(2)?,
                title: row.get(3)?,
                screenshot: row.get(4)?,
                notes: row.get(5)?,
                tags,
                added_at: row.get(7)?,
                last_visited: row.get(8)?,
                visit_count: row.get(9)?,
                is_favorite: row.get(10)?,
            })
        })?;

        pages.collect()
    }
}
