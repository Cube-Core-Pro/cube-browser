use crate::models::media::{MediaItem, Playlist, MediaStats, MediaFilter};
use log::info;
use rusqlite::{params, Connection, Result as SqliteResult};
use std::sync::{Arc, Mutex};

pub struct MediaService {
    conn: Arc<Mutex<Connection>>,
}

impl MediaService {
    pub fn new(db_path: &str) -> Result<Self, String> {
        let conn = Connection::open(db_path)
            .map_err(|e| format!("Failed to open media database: {}", e))?;
        
        let service = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        
        service.init_database()?;
        info!("🎵 Media Player Service initialized");
        
        Ok(service)
    }
    
    fn init_database(&self) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS media_items (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT,
                album TEXT,
                duration_seconds INTEGER NOT NULL,
                file_path TEXT NOT NULL UNIQUE,
                file_size INTEGER NOT NULL,
                media_type TEXT NOT NULL,
                format TEXT NOT NULL,
                thumbnail_path TEXT,
                play_count INTEGER NOT NULL DEFAULT 0,
                last_played_at INTEGER,
                added_at INTEGER NOT NULL,
                is_favorite INTEGER NOT NULL DEFAULT 0,
                metadata TEXT
            )",
            [],
        ).map_err(|e| format!("Failed to create media_items table: {}", e))?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                thumbnail_path TEXT,
                total_duration_seconds INTEGER NOT NULL DEFAULT 0,
                item_count INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                is_favorite INTEGER NOT NULL DEFAULT 0
            )",
            [],
        ).map_err(|e| format!("Failed to create playlists table: {}", e))?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS playlist_items (
                playlist_id TEXT NOT NULL,
                media_id TEXT NOT NULL,
                position INTEGER NOT NULL,
                added_at INTEGER NOT NULL,
                PRIMARY KEY (playlist_id, media_id),
                FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
                FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE
            )",
            [],
        ).map_err(|e| format!("Failed to create playlist_items table: {}", e))?;
        
        // Create indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_media_type ON media_items(media_type)",
            [],
        ).map_err(|e| format!("Failed to create index: {}", e))?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_media_added_at ON media_items(added_at DESC)",
            [],
        ).map_err(|e| format!("Failed to create index: {}", e))?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_media_play_count ON media_items(play_count DESC)",
            [],
        ).map_err(|e| format!("Failed to create index: {}", e))?;
        
        Ok(())
    }
    
    pub fn get_all_media(&self, filter: Option<&MediaFilter>) -> Result<Vec<MediaItem>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let mut query = String::from(
            "SELECT id, title, artist, album, duration_seconds, file_path, file_size,
                    media_type, format, thumbnail_path, play_count, last_played_at,
                    added_at, is_favorite, metadata
             FROM media_items WHERE 1=1"
        );
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(f) = filter {
            if let Some(media_type) = &f.media_type {
                query.push_str(" AND media_type = ?");
                params.push(Box::new(media_type.clone()));
            }
            
            if let Some(is_fav) = f.is_favorite {
                query.push_str(" AND is_favorite = ?");
                params.push(Box::new(if is_fav { 1 } else { 0 }));
            }
            
            if let Some(q) = &f.query {
                query.push_str(" AND (title LIKE ? OR artist LIKE ? OR album LIKE ?)");
                let pattern = format!("%{}%", q);
                params.push(Box::new(pattern.clone()));
                params.push(Box::new(pattern.clone()));
                params.push(Box::new(pattern));
            }
        }
        
        query.push_str(" ORDER BY added_at DESC");
        
        let mut stmt = conn.prepare(&query)
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|b| b.as_ref()).collect();
        
        let media_items = stmt.query_map(&param_refs[..], |row| {
            Ok(MediaItem {
                id: row.get(0)?,
                title: row.get(1)?,
                artist: row.get(2)?,
                album: row.get(3)?,
                duration_seconds: row.get(4)?,
                file_path: row.get(5)?,
                file_size: row.get(6)?,
                media_type: row.get(7)?,
                format: row.get(8)?,
                thumbnail_path: row.get(9)?,
                play_count: row.get(10)?,
                last_played_at: row.get(11)?,
                added_at: row.get(12)?,
                is_favorite: row.get::<_, i32>(13)? != 0,
                metadata: row.get(14)?,
                playlist_ids: Vec::new(), // Will be populated separately if needed
            })
        }).map_err(|e| format!("Failed to query media: {}", e))?;
        
        media_items
            .collect::<SqliteResult<Vec<_>>>()
            .map_err(|e| format!("Failed to collect media: {}", e))
    }
    
    pub fn get_media_item(&self, id: &str) -> Result<Option<MediaItem>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let result = conn.query_row(
            "SELECT id, title, artist, album, duration_seconds, file_path, file_size,
                    media_type, format, thumbnail_path, play_count, last_played_at,
                    added_at, is_favorite, metadata
             FROM media_items WHERE id = ?1",
            [id],
            |row| {
                Ok(MediaItem {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    artist: row.get(2)?,
                    album: row.get(3)?,
                    duration_seconds: row.get(4)?,
                    file_path: row.get(5)?,
                    file_size: row.get(6)?,
                    media_type: row.get(7)?,
                    format: row.get(8)?,
                    thumbnail_path: row.get(9)?,
                    play_count: row.get(10)?,
                    last_played_at: row.get(11)?,
                    added_at: row.get(12)?,
                    is_favorite: row.get::<_, i32>(13)? != 0,
                    metadata: row.get(14)?,
                    playlist_ids: Vec::new(),
                })
            },
        );
        
        match result {
            Ok(media) => Ok(Some(media)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("Failed to get media item: {}", e)),
        }
    }
    
    pub fn add_media_item(&self, media: &MediaItem) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "INSERT INTO media_items (id, title, artist, album, duration_seconds, file_path,
                                     file_size, media_type, format, thumbnail_path, play_count,
                                     last_played_at, added_at, is_favorite, metadata)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                media.id,
                media.title,
                media.artist,
                media.album,
                media.duration_seconds,
                media.file_path,
                media.file_size,
                media.media_type,
                media.format,
                media.thumbnail_path,
                media.play_count,
                media.last_played_at,
                media.added_at,
                if media.is_favorite { 1 } else { 0 },
                media.metadata,
            ],
        ).map_err(|e| format!("Failed to add media item: {}", e))?;
        
        Ok(())
    }
    
    pub fn update_media_item(&self, media: &MediaItem) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "UPDATE media_items SET
                title = ?2, artist = ?3, album = ?4, duration_seconds = ?5,
                thumbnail_path = ?6, is_favorite = ?7, metadata = ?8
             WHERE id = ?1",
            params![
                media.id,
                media.title,
                media.artist,
                media.album,
                media.duration_seconds,
                media.thumbnail_path,
                if media.is_favorite { 1 } else { 0 },
                media.metadata,
            ],
        ).map_err(|e| format!("Failed to update media item: {}", e))?;
        
        Ok(())
    }
    
    pub fn delete_media_item(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute("DELETE FROM media_items WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete media item: {}", e))?;
        
        Ok(())
    }
    
    pub fn increment_play_count(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let now = chrono::Utc::now().timestamp();
        
        conn.execute(
            "UPDATE media_items SET play_count = play_count + 1, last_played_at = ?2 WHERE id = ?1",
            params![id, now],
        ).map_err(|e| format!("Failed to increment play count: {}", e))?;
        
        Ok(())
    }
    
    pub fn toggle_favorite(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "UPDATE media_items SET is_favorite = NOT is_favorite WHERE id = ?1",
            params![id],
        ).map_err(|e| format!("Failed to toggle favorite: {}", e))?;
        
        Ok(())
    }
    
    // Playlist methods
    
    pub fn get_all_playlists(&self) -> Result<Vec<Playlist>, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, description, thumbnail_path, total_duration_seconds,
                    item_count, created_at, updated_at, is_favorite
             FROM playlists
             ORDER BY updated_at DESC"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let playlists = stmt.query_map([], |row| {
            Ok(Playlist {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                thumbnail_path: row.get(3)?,
                total_duration_seconds: row.get(4)?,
                item_count: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
                is_favorite: row.get::<_, i32>(8)? != 0,
                media_ids: Vec::new(), // Will be populated separately
            })
        }).map_err(|e| format!("Failed to query playlists: {}", e))?;
        
        playlists
            .collect::<SqliteResult<Vec<_>>>()
            .map_err(|e| format!("Failed to collect playlists: {}", e))
    }
    
    pub fn create_playlist(&self, playlist: &Playlist) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "INSERT INTO playlists (id, name, description, thumbnail_path, total_duration_seconds,
                                   item_count, created_at, updated_at, is_favorite)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                playlist.id,
                playlist.name,
                playlist.description,
                playlist.thumbnail_path,
                playlist.total_duration_seconds,
                playlist.item_count,
                playlist.created_at,
                playlist.updated_at,
                if playlist.is_favorite { 1 } else { 0 },
            ],
        ).map_err(|e| format!("Failed to create playlist: {}", e))?;
        
        Ok(())
    }
    
    pub fn add_to_playlist(&self, playlist_id: &str, media_id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let now = chrono::Utc::now().timestamp();
        
        // Get current max position
        let position: i32 = conn.query_row(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM playlist_items WHERE playlist_id = ?1",
            params![playlist_id],
            |row| row.get(0),
        ).unwrap_or(0);
        
        conn.execute(
            "INSERT INTO playlist_items (playlist_id, media_id, position, added_at)
             VALUES (?1, ?2, ?3, ?4)",
            params![playlist_id, media_id, position, now],
        ).map_err(|e| format!("Failed to add to playlist: {}", e))?;
        
        // Update playlist counts
        self.update_playlist_stats(playlist_id)?;
        
        Ok(())
    }
    
    pub fn remove_from_playlist(&self, playlist_id: &str, media_id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        conn.execute(
            "DELETE FROM playlist_items WHERE playlist_id = ?1 AND media_id = ?2",
            params![playlist_id, media_id],
        ).map_err(|e| format!("Failed to remove from playlist: {}", e))?;
        
        // Update playlist counts
        self.update_playlist_stats(playlist_id)?;
        
        Ok(())
    }
    
    fn update_playlist_stats(&self, playlist_id: &str) -> Result<(), String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let now = chrono::Utc::now().timestamp();
        
        conn.execute(
            "UPDATE playlists SET
                item_count = (SELECT COUNT(*) FROM playlist_items WHERE playlist_id = ?1),
                total_duration_seconds = (
                    SELECT COALESCE(SUM(m.duration_seconds), 0)
                    FROM playlist_items pi
                    JOIN media_items m ON pi.media_id = m.id
                    WHERE pi.playlist_id = ?1
                ),
                updated_at = ?2
             WHERE id = ?1",
            params![playlist_id, now],
        ).map_err(|e| format!("Failed to update playlist stats: {}", e))?;
        
        Ok(())
    }
    
    pub fn get_stats(&self) -> Result<MediaStats, String> {
        let conn = self.conn.lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        
        let total_media: i32 = conn.query_row(
            "SELECT COUNT(*) FROM media_items",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        let total_audio: i32 = conn.query_row(
            "SELECT COUNT(*) FROM media_items WHERE media_type = 'audio'",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        let total_video: i32 = conn.query_row(
            "SELECT COUNT(*) FROM media_items WHERE media_type = 'video'",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        let total_playlists: i32 = conn.query_row(
            "SELECT COUNT(*) FROM playlists",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        let total_duration: i64 = conn.query_row(
            "SELECT COALESCE(SUM(duration_seconds), 0) FROM media_items",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        let total_storage: i64 = conn.query_row(
            "SELECT COALESCE(SUM(file_size), 0) FROM media_items",
            [],
            |row| row.get(0),
        ).unwrap_or(0);
        
        // Get most played
        let mut stmt = conn.prepare(
            "SELECT id, title, artist, album, duration_seconds, file_path, file_size,
                    media_type, format, thumbnail_path, play_count, last_played_at,
                    added_at, is_favorite, metadata
             FROM media_items
             ORDER BY play_count DESC
             LIMIT 10"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;
        
        let most_played = stmt.query_map([], |row| {
            Ok(MediaItem {
                id: row.get(0)?,
                title: row.get(1)?,
                artist: row.get(2)?,
                album: row.get(3)?,
                duration_seconds: row.get(4)?,
                file_path: row.get(5)?,
                file_size: row.get(6)?,
                media_type: row.get(7)?,
                format: row.get(8)?,
                thumbnail_path: row.get(9)?,
                play_count: row.get(10)?,
                last_played_at: row.get(11)?,
                added_at: row.get(12)?,
                is_favorite: row.get::<_, i32>(13)? != 0,
                metadata: row.get(14)?,
                playlist_ids: Vec::new(),
            })
        }).map_err(|e| format!("Failed to query most played: {}", e))?
            .collect::<SqliteResult<Vec<_>>>()
            .map_err(|e| format!("Failed to collect most played: {}", e))?;
        
        Ok(MediaStats {
            total_media,
            total_audio,
            total_video,
            total_playlists,
            total_duration_seconds: total_duration,
            total_storage_bytes: total_storage,
            most_played,
        })
    }
}
