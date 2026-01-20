use chrono::Utc;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

// Import extended schema
use crate::database_schema;

/// Database manager for CUBE Elite
/// Handles SQLite database initialization and operations
#[derive(Clone)]
pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    /// Initialize database with app data directory
    pub fn new(app_data_dir: PathBuf) -> Result<Self> {
        let db_path = app_data_dir.join("cubeelite.db");
        let conn = Connection::open(db_path)?;

        // Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON", [])?;

        // Create core tables
        Self::create_tables(&conn)?;
        
        // Create extended tables (investors, affiliates, SSO, tenants, profiles)
        database_schema::create_extended_tables(&conn)?;

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }

    /// Create all database tables
    fn create_tables(conn: &Connection) -> Result<()> {
        // Settings table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            )
            "#,
            [],
        )?;

        // API Keys table (encrypted values stored separately)
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                service TEXT NOT NULL,
                encrypted_key TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
            "#,
            [],
        )?;

        // Workflows table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS workflows (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                data TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
            "#,
            [],
        )?;

        // Profiles table (for autofill)
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                data TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
            "#,
            [],
        )?;

        // History table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                title TEXT,
                visited_at INTEGER NOT NULL,
                workspace_id TEXT
            )
            "#,
            [],
        )?;

        // Bookmarks table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS bookmarks (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                title TEXT NOT NULL,
                folder TEXT,
                created_at INTEGER NOT NULL
            )
            "#,
            [],
        )?;

        // Downloads table
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS downloads (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                status TEXT NOT NULL,
                total_bytes INTEGER,
                downloaded_bytes INTEGER,
                started_at INTEGER NOT NULL,
                completed_at INTEGER
            )
            "#,
            [],
        )?;

        // WhatsApp messages log
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS whatsapp_messages (
                id TEXT PRIMARY KEY,
                phone_number TEXT NOT NULL,
                message TEXT NOT NULL,
                media_url TEXT,
                sent_at INTEGER NOT NULL,
                status TEXT NOT NULL
            )
            "#,
            [],
        )?;

        // Monday.com sync log
        conn.execute(
            r#"
            CREATE TABLE IF NOT EXISTS monday_sync_log (
                id TEXT PRIMARY KEY,
                board_id TEXT NOT NULL,
                item_id TEXT,
                action TEXT NOT NULL,
                data TEXT,
                synced_at INTEGER NOT NULL,
                status TEXT NOT NULL
            )
            "#,
            [],
        )?;

        Ok(())
    }

    /// Get setting value
    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?")?;
        let result = stmt.query_row(params![key], |row| row.get(0));

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Set setting value
    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
            params![key, value, now],
        )?;

        Ok(())
    }

    /// Save API key (value should be encrypted before passing)
    pub fn save_api_key(&self, id: &str, service: &str, encrypted_key: &str) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO api_keys (id, service, encrypted_key, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            "#,
            params![id, service, encrypted_key, now, now],
        )?;

        Ok(())
    }

    /// Get API key by service
    pub fn get_api_key(&self, service: &str) -> Result<Option<String>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT encrypted_key FROM api_keys WHERE service = ? ORDER BY updated_at DESC LIMIT 1",
        )?;
        let result = stmt.query_row(params![service], |row| row.get(0));

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Save workflow
    pub fn save_workflow(
        &self,
        id: &str,
        name: &str,
        description: Option<&str>,
        data: &str,
    ) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO workflows (id, name, description, data, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
            params![id, name, description, data, now, now],
        )?;

        Ok(())
    }

    /// Get all workflows
    pub fn get_workflows(&self) -> Result<Vec<WorkflowRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare("SELECT id, name, description, data, created_at, updated_at FROM workflows ORDER BY updated_at DESC")?;

        let workflows = stmt.query_map([], |row| {
            Ok(WorkflowRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                data: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })?;

        workflows.collect()
    }

    /// Add URL to history
    pub fn add_history(
        &self,
        url: &str,
        title: Option<&str>,
        workspace_id: Option<&str>,
    ) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            "INSERT INTO history (url, title, visited_at, workspace_id) VALUES (?, ?, ?, ?)",
            params![url, title, now, workspace_id],
        )?;

        Ok(())
    }

    /// Get recent history
    pub fn get_history(&self, limit: usize) -> Result<Vec<HistoryRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare("SELECT id, url, title, visited_at, workspace_id FROM history ORDER BY visited_at DESC LIMIT ?")?;

        let history = stmt.query_map(params![limit], |row| {
            Ok(HistoryRecord {
                id: row.get(0)?,
                url: row.get(1)?,
                title: row.get(2)?,
                visited_at: row.get(3)?,
                workspace_id: row.get(4)?,
            })
        })?;

        history.collect()
    }

    /// Clear old history
    pub fn clear_old_history(&self, days: i64) -> Result<usize> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let cutoff = Utc::now().timestamp() - (days * 24 * 60 * 60);

        let rows = conn.execute("DELETE FROM history WHERE visited_at < ?", params![cutoff])?;

        Ok(rows)
    }

    // ========================================================================
    // INVESTOR DATABASE OPERATIONS
    // ========================================================================

    /// Save investor profile
    pub fn save_investor(&self, investor: &InvestorRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO investors 
            (id, user_id, tier, name, email, company, kyc_verified, accredited_investor,
             total_invested, total_returns, cube_tokens, staked_tokens, wallet_address,
             bank_details, preferences, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                investor.id,
                investor.user_id,
                investor.tier,
                investor.name,
                investor.email,
                investor.company,
                investor.kyc_verified as i32,
                investor.accredited_investor as i32,
                investor.total_invested,
                investor.total_returns,
                investor.cube_tokens,
                investor.staked_tokens,
                investor.wallet_address,
                investor.bank_details,
                investor.preferences,
                investor.status,
                investor.created_at.unwrap_or(now),
                now
            ],
        )?;

        Ok(())
    }

    /// Get investor by ID
    pub fn get_investor(&self, investor_id: &str) -> Result<Option<InvestorRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, user_id, tier, name, email, company, kyc_verified, accredited_investor,
             total_invested, total_returns, cube_tokens, staked_tokens, wallet_address,
             bank_details, preferences, status, created_at, updated_at
             FROM investors WHERE id = ?"
        )?;

        let result = stmt.query_row(params![investor_id], |row| {
            Ok(InvestorRecord {
                id: row.get(0)?,
                user_id: row.get(1)?,
                tier: row.get(2)?,
                name: row.get(3)?,
                email: row.get(4)?,
                company: row.get(5)?,
                kyc_verified: row.get::<_, i32>(6)? != 0,
                accredited_investor: row.get::<_, i32>(7)? != 0,
                total_invested: row.get(8)?,
                total_returns: row.get(9)?,
                cube_tokens: row.get(10)?,
                staked_tokens: row.get(11)?,
                wallet_address: row.get(12)?,
                bank_details: row.get(13)?,
                preferences: row.get(14)?,
                status: row.get(15)?,
                created_at: row.get(16)?,
                updated_at: row.get(17)?,
            })
        });

        match result {
            Ok(investor) => Ok(Some(investor)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get investor by user ID
    pub fn get_investor_by_user(&self, user_id: &str) -> Result<Option<InvestorRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, user_id, tier, name, email, company, kyc_verified, accredited_investor,
             total_invested, total_returns, cube_tokens, staked_tokens, wallet_address,
             bank_details, preferences, status, created_at, updated_at
             FROM investors WHERE user_id = ?"
        )?;

        let result = stmt.query_row(params![user_id], |row| {
            Ok(InvestorRecord {
                id: row.get(0)?,
                user_id: row.get(1)?,
                tier: row.get(2)?,
                name: row.get(3)?,
                email: row.get(4)?,
                company: row.get(5)?,
                kyc_verified: row.get::<_, i32>(6)? != 0,
                accredited_investor: row.get::<_, i32>(7)? != 0,
                total_invested: row.get(8)?,
                total_returns: row.get(9)?,
                cube_tokens: row.get(10)?,
                staked_tokens: row.get(11)?,
                wallet_address: row.get(12)?,
                bank_details: row.get(13)?,
                preferences: row.get(14)?,
                status: row.get(15)?,
                created_at: row.get(16)?,
                updated_at: row.get(17)?,
            })
        });

        match result {
            Ok(investor) => Ok(Some(investor)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Delete investor (soft delete)
    pub fn delete_investor(&self, investor_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE investors SET status = 'deleted', updated_at = ? WHERE id = ?",
            params![now, investor_id],
        )?;

        Ok(rows > 0)
    }

    /// Update investor KYC status
    pub fn update_investor_kyc(&self, investor_id: &str, verified: bool) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE investors SET kyc_verified = ?, updated_at = ? WHERE id = ?",
            params![verified as i32, now, investor_id],
        )?;

        Ok(rows > 0)
    }

    /// Save investment
    pub fn save_investment(&self, investment: &InvestmentRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO investments 
            (id, investor_id, tier, amount, equity_percentage, interest_rate, term_months,
             status, contract_id, start_date, maturity_date, returns_to_date, next_payout_date,
             created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                investment.id,
                investment.investor_id,
                investment.tier,
                investment.amount,
                investment.equity_percentage,
                investment.interest_rate,
                investment.term_months,
                investment.status,
                investment.contract_id,
                investment.start_date,
                investment.maturity_date,
                investment.returns_to_date,
                investment.next_payout_date,
                investment.created_at.unwrap_or(now),
                now
            ],
        )?;

        Ok(())
    }

    /// Get investment by ID
    pub fn get_investment(&self, investment_id: &str) -> Result<Option<InvestmentRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, investor_id, tier, amount, equity_percentage, interest_rate, term_months,
             status, contract_id, start_date, maturity_date, returns_to_date, next_payout_date,
             created_at, updated_at
             FROM investments WHERE id = ?"
        )?;

        let result = stmt.query_row(params![investment_id], |row| {
            Ok(InvestmentRecord {
                id: row.get(0)?,
                investor_id: row.get(1)?,
                tier: row.get(2)?,
                amount: row.get(3)?,
                equity_percentage: row.get(4)?,
                interest_rate: row.get(5)?,
                term_months: row.get(6)?,
                status: row.get(7)?,
                contract_id: row.get(8)?,
                start_date: row.get(9)?,
                maturity_date: row.get(10)?,
                returns_to_date: row.get(11)?,
                next_payout_date: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        });

        match result {
            Ok(investment) => Ok(Some(investment)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get investments by investor ID
    pub fn get_investor_investments(&self, investor_id: &str) -> Result<Vec<InvestmentRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, investor_id, tier, amount, equity_percentage, interest_rate, term_months,
             status, contract_id, start_date, maturity_date, returns_to_date, next_payout_date,
             created_at, updated_at
             FROM investments WHERE investor_id = ? ORDER BY created_at DESC"
        )?;

        let investments = stmt.query_map(params![investor_id], |row| {
            Ok(InvestmentRecord {
                id: row.get(0)?,
                investor_id: row.get(1)?,
                tier: row.get(2)?,
                amount: row.get(3)?,
                equity_percentage: row.get(4)?,
                interest_rate: row.get(5)?,
                term_months: row.get(6)?,
                status: row.get(7)?,
                contract_id: row.get(8)?,
                start_date: row.get(9)?,
                maturity_date: row.get(10)?,
                returns_to_date: row.get(11)?,
                next_payout_date: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })?;

        investments.collect()
    }

    /// Update investment status
    pub fn update_investment_status(&self, investment_id: &str, status: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE investments SET status = ?, updated_at = ? WHERE id = ?",
            params![status, now, investment_id],
        )?;

        Ok(rows > 0)
    }

    /// Save payout schedule item
    pub fn save_payout(&self, payout: &PayoutRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO payout_schedule 
            (id, investment_id, investor_id, amount, payout_type, scheduled_date,
             status, paid_date, transaction_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                payout.id,
                payout.investment_id,
                payout.investor_id,
                payout.amount,
                payout.payout_type,
                payout.scheduled_date,
                payout.status,
                payout.paid_date,
                payout.transaction_id,
                payout.created_at.unwrap_or(now)
            ],
        )?;

        Ok(())
    }

    /// Get payout schedule for investor
    pub fn get_investor_payouts(&self, investor_id: &str) -> Result<Vec<PayoutRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, investment_id, investor_id, amount, payout_type, scheduled_date,
             status, paid_date, transaction_id, created_at
             FROM payout_schedule WHERE investor_id = ? ORDER BY scheduled_date ASC"
        )?;

        let payouts = stmt.query_map(params![investor_id], |row| {
            Ok(PayoutRecord {
                id: row.get(0)?,
                investment_id: row.get(1)?,
                investor_id: row.get(2)?,
                amount: row.get(3)?,
                payout_type: row.get(4)?,
                scheduled_date: row.get(5)?,
                status: row.get(6)?,
                paid_date: row.get(7)?,
                transaction_id: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?;

        payouts.collect()
    }

    /// Update investor token balance
    pub fn update_investor_tokens(
        &self,
        investor_id: &str,
        cube_tokens: f64,
        staked_tokens: f64,
    ) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE investors SET cube_tokens = ?, staked_tokens = ?, updated_at = ? WHERE id = ?",
            params![cube_tokens, staked_tokens, now, investor_id],
        )?;

        Ok(rows > 0)
    }

    /// Save investor notification
    pub fn save_investor_notification(&self, notification: &NotificationRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT INTO investor_notifications 
            (id, investor_id, notification_type, title, message, read, action_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                notification.id,
                notification.investor_id,
                notification.notification_type,
                notification.title,
                notification.message,
                notification.read as i32,
                notification.action_url,
                notification.created_at.unwrap_or(now)
            ],
        )?;

        Ok(())
    }

    /// Get investor notifications
    pub fn get_investor_notifications(&self, investor_id: &str, limit: i32) -> Result<Vec<NotificationRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, investor_id, notification_type, title, message, read, action_url, created_at
             FROM investor_notifications WHERE investor_id = ? ORDER BY created_at DESC LIMIT ?"
        )?;

        let notifications = stmt.query_map(params![investor_id, limit], |row| {
            Ok(NotificationRecord {
                id: row.get(0)?,
                investor_id: row.get(1)?,
                notification_type: row.get(2)?,
                title: row.get(3)?,
                message: row.get(4)?,
                read: row.get::<_, i32>(5)? != 0,
                action_url: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;

        notifications.collect()
    }

    /// Mark notification as read
    pub fn mark_notification_read(&self, notification_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "UPDATE investor_notifications SET read = 1 WHERE id = ?",
            params![notification_id],
        )?;

        Ok(rows > 0)
    }

    /// Mark all notifications as read for investor
    pub fn mark_all_notifications_read(&self, investor_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "UPDATE investor_notifications SET read = 1 WHERE investor_id = ?",
            params![investor_id],
        )?;

        Ok(rows > 0)
    }

    // ========================================================================
    // TENANT DATABASE OPERATIONS
    // ========================================================================

    /// Save tenant to database
    pub fn save_tenant(&self, tenant: &TenantRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO tenants 
            (id, name, slug, domain, logo, primary_color, status, subscription_tier,
             max_users, max_storage_gb, features, settings, billing_email, billing_address,
             stripe_customer_id, stripe_subscription_id, trial_ends_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                tenant.id,
                tenant.name,
                tenant.slug,
                tenant.domain,
                tenant.logo,
                tenant.primary_color,
                tenant.status,
                tenant.subscription_tier,
                tenant.max_users,
                tenant.max_storage_gb,
                tenant.features,
                tenant.settings,
                tenant.billing_email,
                tenant.billing_address,
                tenant.stripe_customer_id,
                tenant.stripe_subscription_id,
                tenant.trial_ends_at,
                tenant.created_at,
                now
            ],
        )?;

        Ok(())
    }

    /// Get tenant by ID
    pub fn get_tenant(&self, tenant_id: &str) -> Result<Option<TenantRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, name, slug, domain, logo, primary_color, status, subscription_tier,
             max_users, max_storage_gb, features, settings, billing_email, billing_address,
             stripe_customer_id, stripe_subscription_id, trial_ends_at, created_at, updated_at
             FROM tenants WHERE id = ?"
        )?;

        let result = stmt.query_row(params![tenant_id], |row| {
            Ok(TenantRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                slug: row.get(2)?,
                domain: row.get(3)?,
                logo: row.get(4)?,
                primary_color: row.get(5)?,
                status: row.get(6)?,
                subscription_tier: row.get(7)?,
                max_users: row.get(8)?,
                max_storage_gb: row.get(9)?,
                features: row.get(10)?,
                settings: row.get(11)?,
                billing_email: row.get(12)?,
                billing_address: row.get(13)?,
                stripe_customer_id: row.get(14)?,
                stripe_subscription_id: row.get(15)?,
                trial_ends_at: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        });

        match result {
            Ok(tenant) => Ok(Some(tenant)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get tenant by slug
    pub fn get_tenant_by_slug(&self, slug: &str) -> Result<Option<TenantRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, name, slug, domain, logo, primary_color, status, subscription_tier,
             max_users, max_storage_gb, features, settings, billing_email, billing_address,
             stripe_customer_id, stripe_subscription_id, trial_ends_at, created_at, updated_at
             FROM tenants WHERE slug = ?"
        )?;

        let result = stmt.query_row(params![slug], |row| {
            Ok(TenantRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                slug: row.get(2)?,
                domain: row.get(3)?,
                logo: row.get(4)?,
                primary_color: row.get(5)?,
                status: row.get(6)?,
                subscription_tier: row.get(7)?,
                max_users: row.get(8)?,
                max_storage_gb: row.get(9)?,
                features: row.get(10)?,
                settings: row.get(11)?,
                billing_email: row.get(12)?,
                billing_address: row.get(13)?,
                stripe_customer_id: row.get(14)?,
                stripe_subscription_id: row.get(15)?,
                trial_ends_at: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        });

        match result {
            Ok(tenant) => Ok(Some(tenant)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get all tenants
    pub fn get_all_tenants(&self) -> Result<Vec<TenantRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, name, slug, domain, logo, primary_color, status, subscription_tier,
             max_users, max_storage_gb, features, settings, billing_email, billing_address,
             stripe_customer_id, stripe_subscription_id, trial_ends_at, created_at, updated_at
             FROM tenants ORDER BY created_at DESC"
        )?;

        let tenants = stmt.query_map([], |row| {
            Ok(TenantRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                slug: row.get(2)?,
                domain: row.get(3)?,
                logo: row.get(4)?,
                primary_color: row.get(5)?,
                status: row.get(6)?,
                subscription_tier: row.get(7)?,
                max_users: row.get(8)?,
                max_storage_gb: row.get(9)?,
                features: row.get(10)?,
                settings: row.get(11)?,
                billing_email: row.get(12)?,
                billing_address: row.get(13)?,
                stripe_customer_id: row.get(14)?,
                stripe_subscription_id: row.get(15)?,
                trial_ends_at: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        })?;

        tenants.collect()
    }

    /// Update tenant status
    pub fn update_tenant_status(&self, tenant_id: &str, status: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE tenants SET status = ?, updated_at = ? WHERE id = ?",
            params![status, now, tenant_id],
        )?;

        Ok(rows > 0)
    }

    /// Delete tenant (soft delete)
    pub fn delete_tenant(&self, tenant_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE tenants SET status = 'deleted', updated_at = ? WHERE id = ?",
            params![now, tenant_id],
        )?;

        Ok(rows > 0)
    }

    // ========================================================================
    // TENANT USER DATABASE OPERATIONS
    // ========================================================================

    /// Save tenant user to database
    pub fn save_tenant_user(&self, user: &TenantUserRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO tenant_users 
            (id, tenant_id, user_id, role, permissions, invited_by, invited_at,
             joined_at, status, last_active_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                user.id,
                user.tenant_id,
                user.user_id,
                user.role,
                user.permissions,
                user.invited_by,
                user.invited_at,
                user.joined_at,
                user.status,
                user.last_active_at,
                user.created_at,
                now
            ],
        )?;

        Ok(())
    }

    /// Get tenant users
    pub fn get_tenant_users(&self, tenant_id: &str) -> Result<Vec<TenantUserRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, user_id, role, permissions, invited_by, invited_at,
             joined_at, status, last_active_at, created_at, updated_at
             FROM tenant_users WHERE tenant_id = ? ORDER BY created_at DESC"
        )?;

        let users = stmt.query_map(params![tenant_id], |row| {
            Ok(TenantUserRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                user_id: row.get(2)?,
                role: row.get(3)?,
                permissions: row.get(4)?,
                invited_by: row.get(5)?,
                invited_at: row.get(6)?,
                joined_at: row.get(7)?,
                status: row.get(8)?,
                last_active_at: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;

        users.collect()
    }

    /// Get single tenant user
    pub fn get_tenant_user(&self, tenant_id: &str, user_id: &str) -> Result<Option<TenantUserRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, user_id, role, permissions, invited_by, invited_at,
             joined_at, status, last_active_at, created_at, updated_at
             FROM tenant_users WHERE tenant_id = ? AND user_id = ?"
        )?;

        let result = stmt.query_row(params![tenant_id, user_id], |row| {
            Ok(TenantUserRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                user_id: row.get(2)?,
                role: row.get(3)?,
                permissions: row.get(4)?,
                invited_by: row.get(5)?,
                invited_at: row.get(6)?,
                joined_at: row.get(7)?,
                status: row.get(8)?,
                last_active_at: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        });

        match result {
            Ok(user) => Ok(Some(user)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Delete tenant user
    pub fn delete_tenant_user(&self, tenant_id: &str, user_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "DELETE FROM tenant_users WHERE tenant_id = ? AND user_id = ?",
            params![tenant_id, user_id],
        )?;

        Ok(rows > 0)
    }

    /// Get user's tenants
    pub fn get_user_tenants(&self, user_id: &str) -> Result<Vec<TenantRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT t.id, t.name, t.slug, t.domain, t.logo, t.primary_color, t.status, 
             t.subscription_tier, t.max_users, t.max_storage_gb, t.features, t.settings, 
             t.billing_email, t.billing_address, t.stripe_customer_id, t.stripe_subscription_id, 
             t.trial_ends_at, t.created_at, t.updated_at
             FROM tenants t
             INNER JOIN tenant_users tu ON t.id = tu.tenant_id
             WHERE tu.user_id = ? AND tu.status = 'active'
             ORDER BY t.name"
        )?;

        let tenants = stmt.query_map(params![user_id], |row| {
            Ok(TenantRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                slug: row.get(2)?,
                domain: row.get(3)?,
                logo: row.get(4)?,
                primary_color: row.get(5)?,
                status: row.get(6)?,
                subscription_tier: row.get(7)?,
                max_users: row.get(8)?,
                max_storage_gb: row.get(9)?,
                features: row.get(10)?,
                settings: row.get(11)?,
                billing_email: row.get(12)?,
                billing_address: row.get(13)?,
                stripe_customer_id: row.get(14)?,
                stripe_subscription_id: row.get(15)?,
                trial_ends_at: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        })?;

        tenants.collect()
    }

    /// Update tenant user role
    pub fn update_tenant_user_role(&self, tenant_id: &str, user_id: &str, role: &str, permissions: Option<&str>) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE tenant_users SET role = ?, permissions = ?, updated_at = ? WHERE tenant_id = ? AND user_id = ?",
            params![role, permissions, now, tenant_id, user_id],
        )?;

        Ok(rows > 0)
    }

    /// Deactivate tenant user
    pub fn deactivate_tenant_user(&self, tenant_id: &str, user_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE tenant_users SET status = 'inactive', updated_at = ? WHERE tenant_id = ? AND user_id = ?",
            params![now, tenant_id, user_id],
        )?;

        Ok(rows > 0)
    }

    /// Remove tenant user
    pub fn remove_tenant_user(&self, tenant_id: &str, user_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "DELETE FROM tenant_users WHERE tenant_id = ? AND user_id = ?",
            params![tenant_id, user_id],
        )?;

        Ok(rows > 0)
    }

    // ========================================================================
    // TENANT INVITATION DATABASE OPERATIONS
    // ========================================================================

    /// Save invitation to database
    pub fn save_invitation(&self, invitation: &TenantInvitationRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        conn.execute(
            r#"
            INSERT OR REPLACE INTO tenant_invitations 
            (id, tenant_id, email, role, invited_by, token, expires_at, accepted_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                invitation.id,
                invitation.tenant_id,
                invitation.email,
                invitation.role,
                invitation.invited_by,
                invitation.token,
                invitation.expires_at,
                invitation.accepted_at,
                invitation.created_at
            ],
        )?;

        Ok(())
    }

    /// Get invitation by token
    pub fn get_invitation_by_token(&self, token: &str) -> Result<Option<TenantInvitationRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, email, role, invited_by, token, expires_at, accepted_at, created_at
             FROM tenant_invitations WHERE token = ?"
        )?;

        let result = stmt.query_row(params![token], |row| {
            Ok(TenantInvitationRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                email: row.get(2)?,
                role: row.get(3)?,
                invited_by: row.get(4)?,
                token: row.get(5)?,
                expires_at: row.get(6)?,
                accepted_at: row.get(7)?,
                created_at: row.get(8)?,
            })
        });

        match result {
            Ok(inv) => Ok(Some(inv)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get tenant invitations
    pub fn get_tenant_invitations(&self, tenant_id: &str) -> Result<Vec<TenantInvitationRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, email, role, invited_by, token, expires_at, accepted_at, created_at
             FROM tenant_invitations WHERE tenant_id = ? AND accepted_at IS NULL ORDER BY created_at DESC"
        )?;

        let invitations = stmt.query_map(params![tenant_id], |row| {
            Ok(TenantInvitationRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                email: row.get(2)?,
                role: row.get(3)?,
                invited_by: row.get(4)?,
                token: row.get(5)?,
                expires_at: row.get(6)?,
                accepted_at: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;

        invitations.collect()
    }

    /// Get single tenant invitation by ID
    pub fn get_tenant_invitation(&self, invitation_id: &str) -> Result<Option<TenantInvitationRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, email, role, invited_by, token, expires_at, accepted_at, created_at
             FROM tenant_invitations WHERE id = ?"
        )?;

        let result = stmt.query_row(params![invitation_id], |row| {
            Ok(TenantInvitationRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                email: row.get(2)?,
                role: row.get(3)?,
                invited_by: row.get(4)?,
                token: row.get(5)?,
                expires_at: row.get(6)?,
                accepted_at: row.get(7)?,
                created_at: row.get(8)?,
            })
        });

        match result {
            Ok(inv) => Ok(Some(inv)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Update invitation expiry date
    pub fn update_invitation_expiry(&self, invitation_id: &str, new_expires_at: i64) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "UPDATE tenant_invitations SET expires_at = ? WHERE id = ?",
            params![new_expires_at, invitation_id],
        )?;

        Ok(rows > 0)
    }

    /// Accept invitation
    pub fn accept_invitation(&self, token: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE tenant_invitations SET accepted_at = ? WHERE token = ? AND accepted_at IS NULL",
            params![now, token],
        )?;

        Ok(rows > 0)
    }

    /// Revoke invitation
    pub fn revoke_invitation(&self, invitation_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "DELETE FROM tenant_invitations WHERE id = ?",
            params![invitation_id],
        )?;

        Ok(rows > 0)
    }

    /// Update invitation status (accepted, revoked, etc.)
    pub fn update_invitation_status(&self, invitation_id: &str, status: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = match status {
            "accepted" => conn.execute(
                "UPDATE tenant_invitations SET accepted_at = ? WHERE id = ?",
                params![now, invitation_id],
            )?,
            "revoked" => conn.execute(
                "DELETE FROM tenant_invitations WHERE id = ?",
                params![invitation_id],
            )?,
            _ => 0,
        };

        Ok(rows > 0)
    }

    // ========================================================================
    // TENANT ROLE DATABASE OPERATIONS
    // ========================================================================

    /// Save tenant role
    pub fn save_tenant_role(&self, role: &TenantRoleRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO tenant_roles 
            (id, tenant_id, name, description, permissions, is_default, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                role.id,
                role.tenant_id,
                role.name,
                role.description,
                role.permissions,
                role.is_default as i32,
                role.created_at,
                now
            ],
        )?;

        Ok(())
    }

    /// Get tenant roles
    pub fn get_tenant_roles(&self, tenant_id: &str) -> Result<Vec<TenantRoleRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, name, description, permissions, is_default, created_at, updated_at
             FROM tenant_roles WHERE tenant_id = ? ORDER BY name"
        )?;

        let roles = stmt.query_map(params![tenant_id], |row| {
            Ok(TenantRoleRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                permissions: row.get(4)?,
                is_default: row.get::<_, i32>(5)? != 0,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        roles.collect()
    }

    /// Delete tenant role
    pub fn delete_tenant_role(&self, role_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "DELETE FROM tenant_roles WHERE id = ?",
            params![role_id],
        )?;

        Ok(rows > 0)
    }

    // ========================================================================
    // TENANT AUDIT LOG DATABASE OPERATIONS
    // ========================================================================

    /// Save audit event
    pub fn save_tenant_audit(&self, audit: &TenantAuditRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        conn.execute(
            r#"
            INSERT INTO tenant_audit_log 
            (id, tenant_id, user_id, action, resource_type, resource_id, 
             old_values, new_values, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                audit.id,
                audit.tenant_id,
                audit.user_id,
                audit.action,
                audit.resource_type,
                audit.resource_id,
                audit.old_values,
                audit.new_values,
                audit.ip_address,
                audit.user_agent,
                audit.created_at
            ],
        )?;

        Ok(())
    }

    /// Get tenant audit log
    pub fn get_tenant_audit_log(&self, tenant_id: &str, limit: i32) -> Result<Vec<TenantAuditRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, user_id, action, resource_type, resource_id,
             old_values, new_values, ip_address, user_agent, created_at
             FROM tenant_audit_log WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?"
        )?;

        let audits = stmt.query_map(params![tenant_id, limit], |row| {
            Ok(TenantAuditRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                user_id: row.get(2)?,
                action: row.get(3)?,
                resource_type: row.get(4)?,
                resource_id: row.get(5)?,
                old_values: row.get(6)?,
                new_values: row.get(7)?,
                ip_address: row.get(8)?,
                user_agent: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;

        audits.collect()
    }

    // ========================================================================
    // TENANT USAGE DATABASE OPERATIONS
    // ========================================================================

    /// Save tenant usage
    pub fn save_tenant_usage(&self, usage: &TenantUsageRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        conn.execute(
            r#"
            INSERT OR REPLACE INTO tenant_usage 
            (id, tenant_id, period, users_count, storage_used_bytes, api_calls, 
             automations_run, ai_tokens_used, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                usage.id,
                usage.tenant_id,
                usage.period,
                usage.users_count,
                usage.storage_used_bytes,
                usage.api_calls,
                usage.automations_run,
                usage.ai_tokens_used,
                usage.created_at
            ],
        )?;

        Ok(())
    }

    /// Get tenant usage for period
    pub fn get_tenant_usage(&self, tenant_id: &str, period: &str) -> Result<Option<TenantUsageRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, period, users_count, storage_used_bytes, api_calls,
             automations_run, ai_tokens_used, created_at
             FROM tenant_usage WHERE tenant_id = ? AND period = ?"
        )?;

        let result = stmt.query_row(params![tenant_id, period], |row| {
            Ok(TenantUsageRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                period: row.get(2)?,
                users_count: row.get(3)?,
                storage_used_bytes: row.get(4)?,
                api_calls: row.get(5)?,
                automations_run: row.get(6)?,
                ai_tokens_used: row.get(7)?,
                created_at: row.get(8)?,
            })
        });

        match result {
            Ok(usage) => Ok(Some(usage)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    // ========================================================================
    // SSO PROVIDER DATABASE OPERATIONS
    // ========================================================================

    /// Save SSO provider
    pub fn save_sso_provider(&self, provider: &SSOProviderRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO sso_providers 
            (id, tenant_id, name, protocol, enabled, entity_id, sso_url, slo_url, certificate,
             client_id, client_secret, authorization_url, token_url, userinfo_url, scopes,
             attribute_mapping, jit_provisioning, default_role, allowed_domains, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                provider.id,
                provider.tenant_id,
                provider.name,
                provider.protocol,
                provider.enabled as i32,
                provider.entity_id,
                provider.sso_url,
                provider.slo_url,
                provider.certificate,
                provider.client_id,
                provider.client_secret,
                provider.authorization_url,
                provider.token_url,
                provider.userinfo_url,
                provider.scopes,
                provider.attribute_mapping,
                provider.jit_provisioning as i32,
                provider.default_role,
                provider.allowed_domains,
                provider.created_at,
                now
            ],
        )?;

        Ok(())
    }

    /// Get SSO provider by ID
    pub fn get_sso_provider(&self, provider_id: &str) -> Result<Option<SSOProviderRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, name, protocol, enabled, entity_id, sso_url, slo_url, certificate,
             client_id, client_secret, authorization_url, token_url, userinfo_url, scopes,
             attribute_mapping, jit_provisioning, default_role, allowed_domains, created_at, updated_at
             FROM sso_providers WHERE id = ?"
        )?;

        let result = stmt.query_row(params![provider_id], |row| {
            Ok(SSOProviderRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                name: row.get(2)?,
                protocol: row.get(3)?,
                enabled: row.get::<_, i32>(4)? != 0,
                entity_id: row.get(5)?,
                sso_url: row.get(6)?,
                slo_url: row.get(7)?,
                certificate: row.get(8)?,
                client_id: row.get(9)?,
                client_secret: row.get(10)?,
                authorization_url: row.get(11)?,
                token_url: row.get(12)?,
                userinfo_url: row.get(13)?,
                scopes: row.get(14)?,
                attribute_mapping: row.get(15)?,
                jit_provisioning: row.get::<_, i32>(16)? != 0,
                default_role: row.get(17)?,
                allowed_domains: row.get(18)?,
                created_at: row.get(19)?,
                updated_at: row.get(20)?,
            })
        });

        match result {
            Ok(provider) => Ok(Some(provider)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get SSO providers for tenant
    pub fn get_tenant_sso_providers(&self, tenant_id: &str) -> Result<Vec<SSOProviderRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, name, protocol, enabled, entity_id, sso_url, slo_url, certificate,
             client_id, client_secret, authorization_url, token_url, userinfo_url, scopes,
             attribute_mapping, jit_provisioning, default_role, allowed_domains, created_at, updated_at
             FROM sso_providers WHERE tenant_id = ? ORDER BY name"
        )?;

        let providers = stmt.query_map(params![tenant_id], |row| {
            Ok(SSOProviderRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                name: row.get(2)?,
                protocol: row.get(3)?,
                enabled: row.get::<_, i32>(4)? != 0,
                entity_id: row.get(5)?,
                sso_url: row.get(6)?,
                slo_url: row.get(7)?,
                certificate: row.get(8)?,
                client_id: row.get(9)?,
                client_secret: row.get(10)?,
                authorization_url: row.get(11)?,
                token_url: row.get(12)?,
                userinfo_url: row.get(13)?,
                scopes: row.get(14)?,
                attribute_mapping: row.get(15)?,
                jit_provisioning: row.get::<_, i32>(16)? != 0,
                default_role: row.get(17)?,
                allowed_domains: row.get(18)?,
                created_at: row.get(19)?,
                updated_at: row.get(20)?,
            })
        })?;

        providers.collect()
    }

    /// Delete SSO provider
    pub fn delete_sso_provider(&self, provider_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "DELETE FROM sso_providers WHERE id = ?",
            params![provider_id],
        )?;

        Ok(rows > 0)
    }

    /// Save SSO session
    pub fn save_sso_session(&self, session: &SSOSessionRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        conn.execute(
            r#"
            INSERT OR REPLACE INTO sso_sessions 
            (id, user_id, provider_id, session_index, name_id, attributes, 
             ip_address, user_agent, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                session.id,
                session.user_id,
                session.provider_id,
                session.session_index,
                session.name_id,
                session.attributes,
                session.ip_address,
                session.user_agent,
                session.created_at,
                session.expires_at
            ],
        )?;

        Ok(())
    }

    /// Get SSO session by ID
    pub fn get_sso_session(&self, session_id: &str) -> Result<Option<SSOSessionRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, user_id, provider_id, session_index, name_id, attributes,
             ip_address, user_agent, created_at, expires_at
             FROM sso_sessions WHERE id = ?"
        )?;

        let result = stmt.query_row(params![session_id], |row| {
            Ok(SSOSessionRecord {
                id: row.get(0)?,
                user_id: row.get(1)?,
                provider_id: row.get(2)?,
                session_index: row.get(3)?,
                name_id: row.get(4)?,
                attributes: row.get(5)?,
                ip_address: row.get(6)?,
                user_agent: row.get(7)?,
                created_at: row.get(8)?,
                expires_at: row.get(9)?,
            })
        });

        match result {
            Ok(session) => Ok(Some(session)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Delete SSO session
    pub fn delete_sso_session(&self, session_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "DELETE FROM sso_sessions WHERE id = ?",
            params![session_id],
        )?;

        Ok(rows > 0)
    }

    // ========================================================================
    // LDAP CONFIG DATABASE OPERATIONS
    // ========================================================================

    /// Save LDAP configuration
    pub fn save_ldap_config(&self, config: &LDAPConfigRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO ldap_configs 
            (id, tenant_id, name, enabled, server_url, port, use_ssl, use_tls,
             bind_dn, bind_password, base_dn, user_filter, group_filter,
             username_attribute, email_attribute, display_name_attribute,
             group_membership_attribute, sync_interval_minutes, last_sync_at,
             sync_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                config.id,
                config.tenant_id,
                config.name,
                config.enabled as i32,
                config.server_url,
                config.port,
                config.use_ssl as i32,
                config.use_tls as i32,
                config.bind_dn,
                config.bind_password,
                config.base_dn,
                config.user_filter,
                config.group_filter,
                config.username_attribute,
                config.email_attribute,
                config.display_name_attribute,
                config.group_membership_attribute,
                config.sync_interval_minutes,
                config.last_sync_at,
                config.sync_status,
                config.created_at,
                now
            ],
        )?;

        Ok(())
    }

    /// Get LDAP config by ID
    pub fn get_ldap_config(&self, config_id: &str) -> Result<Option<LDAPConfigRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, name, enabled, server_url, port, use_ssl, use_tls,
             bind_dn, bind_password, base_dn, user_filter, group_filter,
             username_attribute, email_attribute, display_name_attribute,
             group_membership_attribute, sync_interval_minutes, last_sync_at,
             sync_status, created_at, updated_at
             FROM ldap_configs WHERE id = ?"
        )?;

        let result = stmt.query_row(params![config_id], |row| {
            Ok(LDAPConfigRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                name: row.get(2)?,
                enabled: row.get::<_, i32>(3)? != 0,
                server_url: row.get(4)?,
                port: row.get(5)?,
                use_ssl: row.get::<_, i32>(6)? != 0,
                use_tls: row.get::<_, i32>(7)? != 0,
                bind_dn: row.get(8)?,
                bind_password: row.get(9)?,
                base_dn: row.get(10)?,
                user_filter: row.get(11)?,
                group_filter: row.get(12)?,
                username_attribute: row.get(13)?,
                email_attribute: row.get(14)?,
                display_name_attribute: row.get(15)?,
                group_membership_attribute: row.get(16)?,
                sync_interval_minutes: row.get(17)?,
                last_sync_at: row.get(18)?,
                sync_status: row.get(19)?,
                created_at: row.get(20)?,
                updated_at: row.get(21)?,
            })
        });

        match result {
            Ok(config) => Ok(Some(config)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get LDAP configs for tenant
    pub fn get_tenant_ldap_configs(&self, tenant_id: &str) -> Result<Vec<LDAPConfigRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, tenant_id, name, enabled, server_url, port, use_ssl, use_tls,
             bind_dn, bind_password, base_dn, user_filter, group_filter,
             username_attribute, email_attribute, display_name_attribute,
             group_membership_attribute, sync_interval_minutes, last_sync_at,
             sync_status, created_at, updated_at
             FROM ldap_configs WHERE tenant_id = ? ORDER BY name"
        )?;

        let configs = stmt.query_map(params![tenant_id], |row| {
            Ok(LDAPConfigRecord {
                id: row.get(0)?,
                tenant_id: row.get(1)?,
                name: row.get(2)?,
                enabled: row.get::<_, i32>(3)? != 0,
                server_url: row.get(4)?,
                port: row.get(5)?,
                use_ssl: row.get::<_, i32>(6)? != 0,
                use_tls: row.get::<_, i32>(7)? != 0,
                bind_dn: row.get(8)?,
                bind_password: row.get(9)?,
                base_dn: row.get(10)?,
                user_filter: row.get(11)?,
                group_filter: row.get(12)?,
                username_attribute: row.get(13)?,
                email_attribute: row.get(14)?,
                display_name_attribute: row.get(15)?,
                group_membership_attribute: row.get(16)?,
                sync_interval_minutes: row.get(17)?,
                last_sync_at: row.get(18)?,
                sync_status: row.get(19)?,
                created_at: row.get(20)?,
                updated_at: row.get(21)?,
            })
        })?;

        configs.collect()
    }

    /// Update LDAP sync status
    pub fn update_ldap_sync_status(&self, config_id: &str, status: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE ldap_configs SET sync_status = ?, last_sync_at = ?, updated_at = ? WHERE id = ?",
            params![status, now, now, config_id],
        )?;

        Ok(rows > 0)
    }

    /// Delete LDAP config
    pub fn delete_ldap_config(&self, config_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "DELETE FROM ldap_configs WHERE id = ?",
            params![config_id],
        )?;

        Ok(rows > 0)
    }

    /// Save LDAP group
    pub fn save_ldap_group(&self, group: &LDAPGroupRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO ldap_groups 
            (id, ldap_config_id, distinguished_name, common_name, description,
             mapped_role, member_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                group.id,
                group.ldap_config_id,
                group.distinguished_name,
                group.common_name,
                group.description,
                group.mapped_role,
                group.member_count,
                group.created_at,
                now
            ],
        )?;

        Ok(())
    }

    /// Get LDAP groups for config
    pub fn get_ldap_groups(&self, config_id: &str) -> Result<Vec<LDAPGroupRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, ldap_config_id, distinguished_name, common_name, description,
             mapped_role, member_count, created_at, updated_at
             FROM ldap_groups WHERE ldap_config_id = ? ORDER BY common_name"
        )?;

        let groups = stmt.query_map(params![config_id], |row| {
            Ok(LDAPGroupRecord {
                id: row.get(0)?,
                ldap_config_id: row.get(1)?,
                distinguished_name: row.get(2)?,
                common_name: row.get(3)?,
                description: row.get(4)?,
                mapped_role: row.get(5)?,
                member_count: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        groups.collect()
    }

    /// Save LDAP user
    pub fn save_ldap_user(&self, user: &LDAPUserRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO ldap_users 
            (id, ldap_config_id, distinguished_name, username, email, display_name,
             groups, enabled, local_user_id, last_sync_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                user.id,
                user.ldap_config_id,
                user.distinguished_name,
                user.username,
                user.email,
                user.display_name,
                user.groups,
                user.enabled as i32,
                user.local_user_id,
                user.last_sync_at,
                user.created_at,
                now
            ],
        )?;

        Ok(())
    }

    /// Get LDAP users for config
    pub fn get_ldap_users(&self, config_id: &str) -> Result<Vec<LDAPUserRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, ldap_config_id, distinguished_name, username, email, display_name,
             groups, enabled, local_user_id, last_sync_at, created_at, updated_at
             FROM ldap_users WHERE ldap_config_id = ? ORDER BY username"
        )?;

        let users = stmt.query_map(params![config_id], |row| {
            Ok(LDAPUserRecord {
                id: row.get(0)?,
                ldap_config_id: row.get(1)?,
                distinguished_name: row.get(2)?,
                username: row.get(3)?,
                email: row.get(4)?,
                display_name: row.get(5)?,
                groups: row.get(6)?,
                enabled: row.get::<_, i32>(7)? != 0,
                local_user_id: row.get(8)?,
                last_sync_at: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;

        users.collect()
    }

    // ========================================================================
    // BROWSER PROFILE DATABASE OPERATIONS
    // ========================================================================

    /// Save browser profile
    pub fn save_browser_profile(&self, profile: &BrowserProfileRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO browser_profiles 
            (id, user_id, tenant_id, name, description, avatar, color, is_default,
             proxy_config, user_agent, viewport, timezone, locale, geolocation,
             cookies_path, storage_path, fingerprint, extensions, startup_urls,
             last_used_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                profile.id,
                profile.user_id,
                profile.tenant_id,
                profile.name,
                profile.description,
                profile.avatar,
                profile.color,
                profile.is_default as i32,
                profile.proxy_config,
                profile.user_agent,
                profile.viewport,
                profile.timezone,
                profile.locale,
                profile.geolocation,
                profile.cookies_path,
                profile.storage_path,
                profile.fingerprint,
                profile.extensions,
                profile.startup_urls,
                profile.last_used_at,
                profile.created_at,
                now
            ],
        )?;

        Ok(())
    }

    /// Get browser profile by ID
    pub fn get_browser_profile(&self, profile_id: &str) -> Result<Option<BrowserProfileRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, user_id, tenant_id, name, description, avatar, color, is_default,
             proxy_config, user_agent, viewport, timezone, locale, geolocation,
             cookies_path, storage_path, fingerprint, extensions, startup_urls,
             last_used_at, created_at, updated_at
             FROM browser_profiles WHERE id = ?"
        )?;

        let result = stmt.query_row(params![profile_id], |row| {
            Ok(BrowserProfileRecord {
                id: row.get(0)?,
                user_id: row.get(1)?,
                tenant_id: row.get(2)?,
                name: row.get(3)?,
                description: row.get(4)?,
                avatar: row.get(5)?,
                color: row.get(6)?,
                is_default: row.get::<_, i32>(7)? != 0,
                proxy_config: row.get(8)?,
                user_agent: row.get(9)?,
                viewport: row.get(10)?,
                timezone: row.get(11)?,
                locale: row.get(12)?,
                geolocation: row.get(13)?,
                cookies_path: row.get(14)?,
                storage_path: row.get(15)?,
                fingerprint: row.get(16)?,
                extensions: row.get(17)?,
                startup_urls: row.get(18)?,
                last_used_at: row.get(19)?,
                created_at: row.get(20)?,
                updated_at: row.get(21)?,
            })
        });

        match result {
            Ok(profile) => Ok(Some(profile)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get browser profiles for user
    pub fn get_user_browser_profiles(&self, user_id: &str) -> Result<Vec<BrowserProfileRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, user_id, tenant_id, name, description, avatar, color, is_default,
             proxy_config, user_agent, viewport, timezone, locale, geolocation,
             cookies_path, storage_path, fingerprint, extensions, startup_urls,
             last_used_at, created_at, updated_at
             FROM browser_profiles WHERE user_id = ? ORDER BY name"
        )?;

        let profiles = stmt.query_map(params![user_id], |row| {
            Ok(BrowserProfileRecord {
                id: row.get(0)?,
                user_id: row.get(1)?,
                tenant_id: row.get(2)?,
                name: row.get(3)?,
                description: row.get(4)?,
                avatar: row.get(5)?,
                color: row.get(6)?,
                is_default: row.get::<_, i32>(7)? != 0,
                proxy_config: row.get(8)?,
                user_agent: row.get(9)?,
                viewport: row.get(10)?,
                timezone: row.get(11)?,
                locale: row.get(12)?,
                geolocation: row.get(13)?,
                cookies_path: row.get(14)?,
                storage_path: row.get(15)?,
                fingerprint: row.get(16)?,
                extensions: row.get(17)?,
                startup_urls: row.get(18)?,
                last_used_at: row.get(19)?,
                created_at: row.get(20)?,
                updated_at: row.get(21)?,
            })
        })?;

        profiles.collect()
    }

    /// Get browser profiles for tenant
    pub fn get_tenant_browser_profiles(&self, tenant_id: &str) -> Result<Vec<BrowserProfileRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, user_id, tenant_id, name, description, avatar, color, is_default,
             proxy_config, user_agent, viewport, timezone, locale, geolocation,
             cookies_path, storage_path, fingerprint, extensions, startup_urls,
             last_used_at, created_at, updated_at
             FROM browser_profiles WHERE tenant_id = ? ORDER BY name"
        )?;

        let profiles = stmt.query_map(params![tenant_id], |row| {
            Ok(BrowserProfileRecord {
                id: row.get(0)?,
                user_id: row.get(1)?,
                tenant_id: row.get(2)?,
                name: row.get(3)?,
                description: row.get(4)?,
                avatar: row.get(5)?,
                color: row.get(6)?,
                is_default: row.get::<_, i32>(7)? != 0,
                proxy_config: row.get(8)?,
                user_agent: row.get(9)?,
                viewport: row.get(10)?,
                timezone: row.get(11)?,
                locale: row.get(12)?,
                geolocation: row.get(13)?,
                cookies_path: row.get(14)?,
                storage_path: row.get(15)?,
                fingerprint: row.get(16)?,
                extensions: row.get(17)?,
                startup_urls: row.get(18)?,
                last_used_at: row.get(19)?,
                created_at: row.get(20)?,
                updated_at: row.get(21)?,
            })
        })?;

        profiles.collect()
    }

    /// Delete browser profile
    pub fn delete_browser_profile(&self, profile_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "DELETE FROM browser_profiles WHERE id = ?",
            params![profile_id],
        )?;

        Ok(rows > 0)
    }

    /// Update profile last used
    pub fn update_profile_last_used(&self, profile_id: &str) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE browser_profiles SET last_used_at = ?, updated_at = ? WHERE id = ?",
            params![now, now, profile_id],
        )?;

        Ok(rows > 0)
    }

    // ========================================================================
    // AFFILIATE DATABASE OPERATIONS
    // ========================================================================

    /// Save affiliate
    pub fn save_affiliate(&self, affiliate: &AffiliateRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        conn.execute(
            r#"
            INSERT OR REPLACE INTO affiliates 
            (id, user_id, email, first_name, last_name, company, website, tier, status,
             referral_code, custom_domain, branding_enabled, parent_affiliate_id,
             affiliate_level, total_referrals, active_referrals, total_earnings,
             pending_earnings, paid_earnings, lifetime_value, sub_affiliates_count,
             sub_affiliate_earnings, payout_method, payout_details, minimum_payout,
             created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                affiliate.id,
                affiliate.user_id,
                affiliate.email,
                affiliate.first_name,
                affiliate.last_name,
                affiliate.company,
                affiliate.website,
                affiliate.tier,
                affiliate.status,
                affiliate.referral_code,
                affiliate.custom_domain,
                affiliate.branding_enabled as i32,
                affiliate.parent_affiliate_id,
                affiliate.affiliate_level,
                affiliate.total_referrals,
                affiliate.active_referrals,
                affiliate.total_earnings,
                affiliate.pending_earnings,
                affiliate.paid_earnings,
                affiliate.lifetime_value,
                affiliate.sub_affiliates_count,
                affiliate.sub_affiliate_earnings,
                affiliate.payout_method,
                affiliate.payout_details,
                affiliate.minimum_payout,
                affiliate.created_at,
                now
            ],
        )?;

        Ok(())
    }

    /// Get affiliate by ID
    pub fn get_affiliate(&self, affiliate_id: &str) -> Result<Option<AffiliateRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, user_id, email, first_name, last_name, company, website, tier, status,
             referral_code, custom_domain, branding_enabled, parent_affiliate_id,
             affiliate_level, total_referrals, active_referrals, total_earnings,
             pending_earnings, paid_earnings, lifetime_value, sub_affiliates_count,
             sub_affiliate_earnings, payout_method, payout_details, minimum_payout,
             created_at, updated_at
             FROM affiliates WHERE id = ?"
        )?;

        let result = stmt.query_row(params![affiliate_id], |row| {
            Ok(AffiliateRecord {
                id: row.get(0)?,
                user_id: row.get(1)?,
                email: row.get(2)?,
                first_name: row.get(3)?,
                last_name: row.get(4)?,
                company: row.get(5)?,
                website: row.get(6)?,
                tier: row.get(7)?,
                status: row.get(8)?,
                referral_code: row.get(9)?,
                custom_domain: row.get(10)?,
                branding_enabled: row.get::<_, i32>(11)? != 0,
                parent_affiliate_id: row.get(12)?,
                affiliate_level: row.get(13)?,
                total_referrals: row.get(14)?,
                active_referrals: row.get(15)?,
                total_earnings: row.get(16)?,
                pending_earnings: row.get(17)?,
                paid_earnings: row.get(18)?,
                lifetime_value: row.get(19)?,
                sub_affiliates_count: row.get(20)?,
                sub_affiliate_earnings: row.get(21)?,
                payout_method: row.get(22)?,
                payout_details: row.get(23)?,
                minimum_payout: row.get(24)?,
                created_at: row.get(25)?,
                updated_at: row.get(26)?,
            })
        });

        match result {
            Ok(affiliate) => Ok(Some(affiliate)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Get affiliate by referral code
    pub fn get_affiliate_by_code(&self, code: &str) -> Result<Option<AffiliateRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, user_id, email, first_name, last_name, company, website, tier, status,
             referral_code, custom_domain, branding_enabled, parent_affiliate_id,
             affiliate_level, total_referrals, active_referrals, total_earnings,
             pending_earnings, paid_earnings, lifetime_value, sub_affiliates_count,
             sub_affiliate_earnings, payout_method, payout_details, minimum_payout,
             created_at, updated_at
             FROM affiliates WHERE referral_code = ?"
        )?;

        let result = stmt.query_row(params![code], |row| {
            Ok(AffiliateRecord {
                id: row.get(0)?,
                user_id: row.get(1)?,
                email: row.get(2)?,
                first_name: row.get(3)?,
                last_name: row.get(4)?,
                company: row.get(5)?,
                website: row.get(6)?,
                tier: row.get(7)?,
                status: row.get(8)?,
                referral_code: row.get(9)?,
                custom_domain: row.get(10)?,
                branding_enabled: row.get::<_, i32>(11)? != 0,
                parent_affiliate_id: row.get(12)?,
                affiliate_level: row.get(13)?,
                total_referrals: row.get(14)?,
                active_referrals: row.get(15)?,
                total_earnings: row.get(16)?,
                pending_earnings: row.get(17)?,
                paid_earnings: row.get(18)?,
                lifetime_value: row.get(19)?,
                sub_affiliates_count: row.get(20)?,
                sub_affiliate_earnings: row.get(21)?,
                payout_method: row.get(22)?,
                payout_details: row.get(23)?,
                minimum_payout: row.get(24)?,
                created_at: row.get(25)?,
                updated_at: row.get(26)?,
            })
        });

        match result {
            Ok(affiliate) => Ok(Some(affiliate)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    }

    /// Update affiliate earnings
    pub fn update_affiliate_earnings(&self, affiliate_id: &str, total: f64, pending: f64, paid: f64) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let now = Utc::now().timestamp();

        let rows = conn.execute(
            "UPDATE affiliates SET total_earnings = ?, pending_earnings = ?, paid_earnings = ?, updated_at = ? WHERE id = ?",
            params![total, pending, paid, now, affiliate_id],
        )?;

        Ok(rows > 0)
    }

    /// Save affiliate link
    pub fn save_affiliate_link(&self, link: &AffiliateLinkRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        conn.execute(
            r#"
            INSERT OR REPLACE INTO affiliate_links 
            (id, affiliate_id, name, url, target_url, utm_campaign,
             utm_source, utm_medium, clicks, conversions, earnings, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                link.id,
                link.affiliate_id,
                link.name,
                link.url,
                link.target_url,
                link.utm_campaign,
                link.utm_source,
                link.utm_medium,
                link.clicks,
                link.conversions,
                link.earnings,
                link.created_at
            ],
        )?;

        Ok(())
    }

    /// Update affiliate link stats (clicks, conversions)
    pub fn update_affiliate_link_stats(&self, link_id: &str, clicks: i32, conversions: i32, earnings: f64) -> Result<bool> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        let rows = conn.execute(
            "UPDATE affiliate_links SET clicks = ?, conversions = ?, earnings = ? WHERE id = ?",
            params![clicks, conversions, earnings, link_id],
        )?;

        Ok(rows > 0)
    }

    /// Save referral
    pub fn save_referral(&self, referral: &ReferralRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        conn.execute(
            r#"
            INSERT OR REPLACE INTO referrals 
            (id, affiliate_id, referred_user_id, referred_email, source, landing_page,
             utm_campaign, utm_source, utm_medium, status, subscription_tier,
             subscription_value, total_commissions, ip_address, user_agent,
             created_at, converted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                referral.id,
                referral.affiliate_id,
                referral.referred_user_id,
                referral.referred_email,
                referral.source,
                referral.landing_page,
                referral.utm_campaign,
                referral.utm_source,
                referral.utm_medium,
                referral.status,
                referral.subscription_tier,
                referral.subscription_value,
                referral.total_commissions,
                referral.ip_address,
                referral.user_agent,
                referral.created_at,
                referral.converted_at
            ],
        )?;

        Ok(())
    }

    /// Get affiliate referrals
    pub fn get_affiliate_referrals(&self, affiliate_id: &str) -> Result<Vec<ReferralRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, affiliate_id, referred_user_id, referred_email, source, landing_page,
             utm_campaign, utm_source, utm_medium, status, subscription_tier,
             subscription_value, total_commissions, ip_address, user_agent,
             created_at, converted_at
             FROM referrals WHERE affiliate_id = ? ORDER BY created_at DESC"
        )?;

        let referrals = stmt.query_map(params![affiliate_id], |row| {
            Ok(ReferralRecord {
                id: row.get(0)?,
                affiliate_id: row.get(1)?,
                referred_user_id: row.get(2)?,
                referred_email: row.get(3)?,
                source: row.get(4)?,
                landing_page: row.get(5)?,
                utm_campaign: row.get(6)?,
                utm_source: row.get(7)?,
                utm_medium: row.get(8)?,
                status: row.get(9)?,
                subscription_tier: row.get(10)?,
                subscription_value: row.get(11)?,
                total_commissions: row.get(12)?,
                ip_address: row.get(13)?,
                user_agent: row.get(14)?,
                created_at: row.get(15)?,
                converted_at: row.get(16)?,
            })
        })?;

        referrals.collect()
    }

    /// Save commission
    pub fn save_commission(&self, commission: &CommissionRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        conn.execute(
            r#"
            INSERT OR REPLACE INTO commissions 
            (id, affiliate_id, referral_id, commission_type, amount, rate, base_amount,
             currency, status, payout_id, description, level, source_affiliate_id,
             created_at, approved_at, paid_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                commission.id,
                commission.affiliate_id,
                commission.referral_id,
                commission.commission_type,
                commission.amount,
                commission.rate,
                commission.base_amount,
                commission.currency,
                commission.status,
                commission.payout_id,
                commission.description,
                commission.level,
                commission.source_affiliate_id,
                commission.created_at,
                commission.approved_at,
                commission.paid_at
            ],
        )?;

        Ok(())
    }

    /// Get affiliate commissions
    pub fn get_affiliate_commissions(&self, affiliate_id: &str) -> Result<Vec<CommissionRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, affiliate_id, referral_id, commission_type, amount, rate, base_amount,
             currency, status, payout_id, description, level, source_affiliate_id,
             created_at, approved_at, paid_at
             FROM commissions WHERE affiliate_id = ? ORDER BY created_at DESC"
        )?;

        let commissions = stmt.query_map(params![affiliate_id], |row| {
            Ok(CommissionRecord {
                id: row.get(0)?,
                affiliate_id: row.get(1)?,
                referral_id: row.get(2)?,
                commission_type: row.get(3)?,
                amount: row.get(4)?,
                rate: row.get(5)?,
                base_amount: row.get(6)?,
                currency: row.get(7)?,
                status: row.get(8)?,
                payout_id: row.get(9)?,
                description: row.get(10)?,
                level: row.get(11)?,
                source_affiliate_id: row.get(12)?,
                created_at: row.get(13)?,
                approved_at: row.get(14)?,
                paid_at: row.get(15)?,
            })
        })?;

        commissions.collect()
    }

    /// Save affiliate payout
    pub fn save_affiliate_payout(&self, payout: &AffiliatePayoutRecord) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;

        conn.execute(
            r#"
            INSERT OR REPLACE INTO affiliate_payouts 
            (id, affiliate_id, amount, currency, method, status, transaction_id,
             failure_reason, created_at, processed_at, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            params![
                payout.id,
                payout.affiliate_id,
                payout.amount,
                payout.currency,
                payout.method,
                payout.status,
                payout.transaction_id,
                payout.failure_reason,
                payout.created_at,
                payout.processed_at,
                payout.completed_at
            ],
        )?;

        Ok(())
    }

    /// Get affiliate payouts
    pub fn get_affiliate_payouts(&self, affiliate_id: &str) -> Result<Vec<AffiliatePayoutRecord>> {
        let conn = self.conn.lock()
            .map_err(|_| rusqlite::Error::ExecuteReturnedResults)?;
        let mut stmt = conn.prepare(
            "SELECT id, affiliate_id, amount, currency, method, status, transaction_id,
             failure_reason, created_at, processed_at, completed_at
             FROM affiliate_payouts WHERE affiliate_id = ? ORDER BY created_at DESC"
        )?;

        let payouts = stmt.query_map(params![affiliate_id], |row| {
            Ok(AffiliatePayoutRecord {
                id: row.get(0)?,
                affiliate_id: row.get(1)?,
                amount: row.get(2)?,
                currency: row.get(3)?,
                method: row.get(4)?,
                status: row.get(5)?,
                transaction_id: row.get(6)?,
                failure_reason: row.get(7)?,
                created_at: row.get(8)?,
                processed_at: row.get(9)?,
                completed_at: row.get(10)?,
            })
        })?;

        payouts.collect()
    }
}

// ========================================================================
// DATABASE RECORD TYPES
// ========================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestorRecord {
    pub id: String,
    pub user_id: Option<String>,
    pub tier: String,
    pub name: String,
    pub email: String,
    pub company: Option<String>,
    pub kyc_verified: bool,
    pub accredited_investor: bool,
    pub total_invested: f64,
    pub total_returns: f64,
    pub cube_tokens: f64,
    pub staked_tokens: f64,
    pub wallet_address: Option<String>,
    pub bank_details: Option<String>,
    pub preferences: Option<String>,
    pub status: String,
    pub created_at: Option<i64>,
    pub updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestmentRecord {
    pub id: String,
    pub investor_id: String,
    pub tier: String,
    pub amount: f64,
    pub equity_percentage: f64,
    pub interest_rate: f64,
    pub term_months: i32,
    pub status: String,
    pub contract_id: Option<String>,
    pub start_date: String,
    pub maturity_date: String,
    pub returns_to_date: f64,
    pub next_payout_date: Option<String>,
    pub created_at: Option<i64>,
    pub updated_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PayoutRecord {
    pub id: String,
    pub investment_id: String,
    pub investor_id: String,
    pub amount: f64,
    pub payout_type: String,
    pub scheduled_date: String,
    pub status: String,
    pub paid_date: Option<String>,
    pub transaction_id: Option<String>,
    pub created_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationRecord {
    pub id: String,
    pub investor_id: String,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub read: bool,
    pub action_url: Option<String>,
    pub created_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowRecord {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub data: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryRecord {
    pub id: i64,
    pub url: String,
    pub title: Option<String>,
    pub visited_at: i64,
    pub workspace_id: Option<String>,
}

// ========================================================================
// TENANT DATABASE RECORD TYPES
// ========================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantRecord {
    pub id: String,
    pub name: String,
    pub slug: String,
    pub domain: Option<String>,
    pub logo: Option<String>,
    pub primary_color: Option<String>,
    pub status: String,
    pub subscription_tier: String,
    pub max_users: i32,
    pub max_storage_gb: i32,
    pub features: Option<String>,
    pub settings: Option<String>,
    pub billing_email: Option<String>,
    pub billing_address: Option<String>,
    pub stripe_customer_id: Option<String>,
    pub stripe_subscription_id: Option<String>,
    pub trial_ends_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantUserRecord {
    pub id: String,
    pub tenant_id: String,
    pub user_id: String,
    pub role: String,
    pub permissions: Option<String>,
    pub invited_by: Option<String>,
    pub invited_at: Option<i64>,
    pub joined_at: Option<i64>,
    pub status: String,
    pub last_active_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantInvitationRecord {
    pub id: String,
    pub tenant_id: String,
    pub email: String,
    pub role: String,
    pub invited_by: String,
    pub token: String,
    pub expires_at: i64,
    pub accepted_at: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantRoleRecord {
    pub id: String,
    pub tenant_id: String,
    pub name: String,
    pub description: Option<String>,
    pub permissions: String,
    pub is_default: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantAuditRecord {
    pub id: String,
    pub tenant_id: String,
    pub user_id: Option<String>,
    pub action: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<String>,
    pub old_values: Option<String>,
    pub new_values: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantUsageRecord {
    pub id: String,
    pub tenant_id: String,
    pub period: String,
    pub users_count: i32,
    pub storage_used_bytes: i64,
    pub api_calls: i32,
    pub automations_run: i32,
    pub ai_tokens_used: i32,
    pub created_at: i64,
}

// ========================================================================
// SSO/LDAP DATABASE RECORD TYPES
// ========================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSOProviderRecord {
    pub id: String,
    pub tenant_id: String,
    pub name: String,
    pub protocol: String,
    pub enabled: bool,
    pub entity_id: Option<String>,
    pub sso_url: Option<String>,
    pub slo_url: Option<String>,
    pub certificate: Option<String>,
    pub client_id: Option<String>,
    pub client_secret: Option<String>,
    pub authorization_url: Option<String>,
    pub token_url: Option<String>,
    pub userinfo_url: Option<String>,
    pub scopes: Option<String>,
    pub attribute_mapping: Option<String>,
    pub jit_provisioning: bool,
    pub default_role: Option<String>,
    pub allowed_domains: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SSOSessionRecord {
    pub id: String,
    pub user_id: String,
    pub provider_id: String,
    pub session_index: Option<String>,
    pub name_id: Option<String>,
    pub attributes: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: i64,
    pub expires_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LDAPConfigRecord {
    pub id: String,
    pub tenant_id: String,
    pub name: String,
    pub enabled: bool,
    pub server_url: String,
    pub port: i32,
    pub use_ssl: bool,
    pub use_tls: bool,
    pub bind_dn: String,
    pub bind_password: String,
    pub base_dn: String,
    pub user_filter: String,
    pub group_filter: String,
    pub username_attribute: String,
    pub email_attribute: String,
    pub display_name_attribute: String,
    pub group_membership_attribute: String,
    pub sync_interval_minutes: i32,
    pub last_sync_at: Option<i64>,
    pub sync_status: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LDAPGroupRecord {
    pub id: String,
    pub ldap_config_id: String,
    pub distinguished_name: String,
    pub common_name: String,
    pub description: Option<String>,
    pub mapped_role: Option<String>,
    pub member_count: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LDAPUserRecord {
    pub id: String,
    pub ldap_config_id: String,
    pub distinguished_name: String,
    pub username: String,
    pub email: Option<String>,
    pub display_name: Option<String>,
    pub groups: Option<String>,
    pub enabled: bool,
    pub local_user_id: Option<String>,
    pub last_sync_at: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

// ========================================================================
// BROWSER PROFILE DATABASE RECORD TYPES
// ========================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserProfileRecord {
    pub id: String,
    pub user_id: Option<String>,
    pub tenant_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub avatar: Option<String>,
    pub color: Option<String>,
    pub is_default: bool,
    pub proxy_config: Option<String>,
    pub user_agent: Option<String>,
    pub viewport: Option<String>,
    pub timezone: Option<String>,
    pub locale: Option<String>,
    pub geolocation: Option<String>,
    pub cookies_path: Option<String>,
    pub storage_path: Option<String>,
    pub fingerprint: Option<String>,
    pub extensions: Option<String>,
    pub startup_urls: Option<String>,
    pub last_used_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

// ========================================================================
// AFFILIATE DATABASE RECORD TYPES
// ========================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AffiliateRecord {
    pub id: String,
    pub user_id: Option<String>,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub company: Option<String>,
    pub website: Option<String>,
    pub tier: String,
    pub status: String,
    pub referral_code: String,
    pub custom_domain: Option<String>,
    pub branding_enabled: bool,
    pub parent_affiliate_id: Option<String>,
    pub affiliate_level: i32,
    pub total_referrals: i32,
    pub active_referrals: i32,
    pub total_earnings: f64,
    pub pending_earnings: f64,
    pub paid_earnings: f64,
    pub lifetime_value: f64,
    pub sub_affiliates_count: i32,
    pub sub_affiliate_earnings: f64,
    pub payout_method: String,
    pub payout_details: Option<String>,
    pub minimum_payout: f64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AffiliateLinkRecord {
    pub id: String,
    pub affiliate_id: String,
    pub name: String,
    pub url: String,
    pub target_url: String,
    pub utm_campaign: Option<String>,
    pub utm_source: Option<String>,
    pub utm_medium: Option<String>,
    pub clicks: i32,
    pub conversions: i32,
    pub earnings: f64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReferralRecord {
    pub id: String,
    pub affiliate_id: String,
    pub referred_user_id: Option<String>,
    pub referred_email: String,
    pub source: String,
    pub landing_page: Option<String>,
    pub utm_campaign: Option<String>,
    pub utm_source: Option<String>,
    pub utm_medium: Option<String>,
    pub status: String,
    pub subscription_tier: Option<String>,
    pub subscription_value: f64,
    pub total_commissions: f64,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: i64,
    pub converted_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommissionRecord {
    pub id: String,
    pub affiliate_id: String,
    pub referral_id: String,
    pub commission_type: String,
    pub amount: f64,
    pub rate: f64,
    pub base_amount: f64,
    pub currency: String,
    pub status: String,
    pub payout_id: Option<String>,
    pub description: Option<String>,
    pub level: i32,
    pub source_affiliate_id: Option<String>,
    pub created_at: i64,
    pub approved_at: Option<i64>,
    pub paid_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AffiliatePayoutRecord {
    pub id: String,
    pub affiliate_id: String,
    pub amount: f64,
    pub currency: String,
    pub method: String,
    pub status: String,
    pub transaction_id: Option<String>,
    pub failure_reason: Option<String>,
    pub created_at: i64,
    pub processed_at: Option<i64>,
    pub completed_at: Option<i64>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_database_initialization() {
        let temp_dir = env::temp_dir().join("cube_elite_test");
        std::fs::create_dir_all(&temp_dir).unwrap();

        let db = Database::new(temp_dir.clone()).unwrap();

        // Test setting
        db.set_setting("test_key", "test_value").unwrap();
        let value = db.get_setting("test_key").unwrap();
        assert_eq!(value, Some("test_value".to_string()));

        // Cleanup
        std::fs::remove_dir_all(&temp_dir).unwrap();
    }
}
