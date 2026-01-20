// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL MEDIA MODULE - Complete Social Media Management Backend
// ═══════════════════════════════════════════════════════════════════════════════
//
// Features:
// - Multi-Platform Post Management
// - Content Scheduling
// - Analytics & Engagement Tracking
// - Video/Shorts Creation
// - Audience Insights
// - Hashtag Management
//
// ═══════════════════════════════════════════════════════════════════════════════

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::command;
use chrono::{DateTime, Utc};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SocialPlatform {
    Twitter,
    Facebook,
    Instagram,
    LinkedIn,
    TikTok,
    YouTube,
    Pinterest,
    Reddit,
    Threads,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PostStatus {
    Draft,
    Scheduled,
    Published,
    Failed,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContentType {
    Text,
    Image,
    Video,
    Carousel,
    Story,
    Reel,
    Short,
    Live,
    Poll,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialAccount {
    pub id: String,
    pub platform: SocialPlatform,
    pub username: String,
    pub display_name: String,
    pub profile_image: Option<String>,
    pub followers: u64,
    pub following: u64,
    pub posts_count: u64,
    pub is_connected: bool,
    pub access_token: Option<String>,
    pub refresh_token: Option<String>,
    pub token_expires_at: Option<String>,
    pub connected_at: String,
    pub last_synced: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialPost {
    pub id: String,
    pub content: String,
    pub content_type: ContentType,
    pub platforms: Vec<SocialPlatform>,
    pub media_urls: Vec<String>,
    pub hashtags: Vec<String>,
    pub mentions: Vec<String>,
    pub link: Option<String>,
    pub status: PostStatus,
    pub scheduled_at: Option<String>,
    pub published_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub analytics: PostAnalytics,
    pub platform_post_ids: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PostAnalytics {
    pub impressions: u64,
    pub reach: u64,
    pub engagements: u64,
    pub likes: u64,
    pub comments: u64,
    pub shares: u64,
    pub saves: u64,
    pub clicks: u64,
    pub video_views: u64,
    pub watch_time: u64,
    pub engagement_rate: f64,
    pub click_through_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentCalendar {
    pub id: String,
    pub name: String,
    pub description: String,
    pub posts: Vec<ScheduledPost>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduledPost {
    pub post_id: String,
    pub scheduled_at: String,
    pub platforms: Vec<SocialPlatform>,
    pub status: PostStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoProject {
    pub id: String,
    pub name: String,
    pub description: String,
    pub project_type: VideoProjectType,
    pub status: VideoStatus,
    pub duration_seconds: u64,
    pub aspect_ratio: String,
    pub scenes: Vec<VideoScene>,
    pub audio_tracks: Vec<AudioTrack>,
    pub captions: Vec<Caption>,
    pub thumbnail_url: Option<String>,
    pub output_url: Option<String>,
    pub platforms: Vec<SocialPlatform>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoProjectType {
    Short,
    Reel,
    TikTok,
    Story,
    Standard,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoStatus {
    Draft,
    Editing,
    Rendering,
    Completed,
    Published,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoScene {
    pub id: String,
    pub order: u32,
    pub duration_ms: u64,
    pub media_url: Option<String>,
    pub text_overlay: Option<TextOverlay>,
    pub transitions: Vec<String>,
    pub effects: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextOverlay {
    pub text: String,
    pub font: String,
    pub size: u32,
    pub color: String,
    pub position: Position,
    pub animation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioTrack {
    pub id: String,
    pub name: String,
    pub url: String,
    pub volume: f64,
    pub start_time: u64,
    pub duration: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Caption {
    pub id: String,
    pub text: String,
    pub start_time: u64,
    pub end_time: u64,
    pub position: Position,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialAnalytics {
    pub period: String,
    pub platform: Option<SocialPlatform>,
    pub total_posts: u64,
    pub total_impressions: u64,
    pub total_reach: u64,
    pub total_engagements: u64,
    pub total_followers: u64,
    pub followers_growth: i64,
    pub avg_engagement_rate: f64,
    pub best_posting_times: Vec<String>,
    pub top_hashtags: Vec<HashtagMetrics>,
    pub content_performance: HashMap<String, ContentMetrics>,
    pub audience_demographics: AudienceDemographics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HashtagMetrics {
    pub hashtag: String,
    pub uses: u64,
    pub reach: u64,
    pub engagement: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentMetrics {
    pub content_type: String,
    pub posts: u64,
    pub avg_engagement: f64,
    pub total_reach: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AudienceDemographics {
    pub age_groups: HashMap<String, f64>,
    pub gender: HashMap<String, f64>,
    pub top_locations: Vec<LocationMetrics>,
    pub interests: Vec<String>,
    pub active_times: HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocationMetrics {
    pub location: String,
    pub percentage: f64,
    pub count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendingTopic {
    pub id: String,
    pub name: String,
    pub hashtag: Option<String>,
    pub volume: u64,
    pub change_percent: f64,
    pub platforms: Vec<SocialPlatform>,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentSuggestion {
    pub id: String,
    pub suggestion_type: String,
    pub content: String,
    pub hashtags: Vec<String>,
    pub best_time: String,
    pub predicted_engagement: f64,
    pub platforms: Vec<SocialPlatform>,
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Default)]
pub struct SocialState {
    pub accounts: Mutex<Vec<SocialAccount>>,
    pub posts: Mutex<Vec<SocialPost>>,
    pub video_projects: Mutex<Vec<VideoProject>>,
    pub calendars: Mutex<Vec<ContentCalendar>>,
}

impl SocialState {
    pub fn new() -> Self {
        Self::default()
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn social_connect_account(
    state: tauri::State<'_, SocialState>,
    platform: String,
    username: String,
    display_name: String,
    access_token: String,
) -> Result<SocialAccount, String> {
    let platform_enum = match platform.to_lowercase().as_str() {
        "twitter" | "x" => SocialPlatform::Twitter,
        "facebook" => SocialPlatform::Facebook,
        "instagram" => SocialPlatform::Instagram,
        "linkedin" => SocialPlatform::LinkedIn,
        "tiktok" => SocialPlatform::TikTok,
        "youtube" => SocialPlatform::YouTube,
        "pinterest" => SocialPlatform::Pinterest,
        "reddit" => SocialPlatform::Reddit,
        "threads" => SocialPlatform::Threads,
        _ => return Err(format!("Unsupported platform: {}", platform)),
    };

    let account = SocialAccount {
        id: uuid::Uuid::new_v4().to_string(),
        platform: platform_enum,
        username,
        display_name,
        profile_image: None,
        followers: 0,
        following: 0,
        posts_count: 0,
        is_connected: true,
        access_token: Some(access_token),
        refresh_token: None,
        token_expires_at: None,
        connected_at: Utc::now().to_rfc3339(),
        last_synced: None,
    };

    let mut accounts = state.accounts.lock().map_err(|e| e.to_string())?;
    accounts.push(account.clone());

    Ok(account)
}

#[command]
pub async fn social_get_accounts(
    state: tauri::State<'_, SocialState>,
) -> Result<Vec<SocialAccount>, String> {
    let accounts = state.accounts.lock().map_err(|e| e.to_string())?;
    
    // Return without sensitive data
    let safe_accounts: Vec<SocialAccount> = accounts.iter()
        .map(|a| SocialAccount {
            access_token: None,
            refresh_token: None,
            ..a.clone()
        })
        .collect();

    Ok(safe_accounts)
}

#[command]
pub async fn social_disconnect_account(
    state: tauri::State<'_, SocialState>,
    account_id: String,
) -> Result<bool, String> {
    let mut accounts = state.accounts.lock().map_err(|e| e.to_string())?;
    let initial_len = accounts.len();
    accounts.retain(|a| a.id != account_id);
    
    Ok(accounts.len() < initial_len)
}

#[command]
pub async fn social_sync_account(
    state: tauri::State<'_, SocialState>,
    account_id: String,
) -> Result<SocialAccount, String> {
    let mut accounts = state.accounts.lock().map_err(|e| e.to_string())?;
    
    let account = accounts.iter_mut()
        .find(|a| a.id == account_id)
        .ok_or_else(|| format!("Account not found: {}", account_id))?;

    // Simulate sync with random data
    account.followers += rand::random::<u64>() % 100;
    account.posts_count += 1;
    account.last_synced = Some(Utc::now().to_rfc3339());

    Ok(SocialAccount {
        access_token: None,
        refresh_token: None,
        ..account.clone()
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn social_create_post(
    state: tauri::State<'_, SocialState>,
    content: String,
    content_type: String,
    platforms: Vec<String>,
    media_urls: Vec<String>,
    hashtags: Vec<String>,
    link: Option<String>,
) -> Result<SocialPost, String> {
    let content_type_enum = match content_type.to_lowercase().as_str() {
        "text" => ContentType::Text,
        "image" => ContentType::Image,
        "video" => ContentType::Video,
        "carousel" => ContentType::Carousel,
        "story" => ContentType::Story,
        "reel" => ContentType::Reel,
        "short" => ContentType::Short,
        "live" => ContentType::Live,
        "poll" => ContentType::Poll,
        _ => ContentType::Text,
    };

    let platform_enums: Vec<SocialPlatform> = platforms.iter()
        .filter_map(|p| match p.to_lowercase().as_str() {
            "twitter" | "x" => Some(SocialPlatform::Twitter),
            "facebook" => Some(SocialPlatform::Facebook),
            "instagram" => Some(SocialPlatform::Instagram),
            "linkedin" => Some(SocialPlatform::LinkedIn),
            "tiktok" => Some(SocialPlatform::TikTok),
            "youtube" => Some(SocialPlatform::YouTube),
            "pinterest" => Some(SocialPlatform::Pinterest),
            "reddit" => Some(SocialPlatform::Reddit),
            "threads" => Some(SocialPlatform::Threads),
            _ => None,
        })
        .collect();

    let post = SocialPost {
        id: uuid::Uuid::new_v4().to_string(),
        content,
        content_type: content_type_enum,
        platforms: platform_enums,
        media_urls,
        hashtags,
        mentions: Vec::new(),
        link,
        status: PostStatus::Draft,
        scheduled_at: None,
        published_at: None,
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
        analytics: PostAnalytics::default(),
        platform_post_ids: HashMap::new(),
    };

    let mut posts = state.posts.lock().map_err(|e| e.to_string())?;
    posts.push(post.clone());

    Ok(post)
}

#[command]
pub async fn social_get_posts(
    state: tauri::State<'_, SocialState>,
    status: Option<String>,
    platform: Option<String>,
) -> Result<Vec<SocialPost>, String> {
    let posts = state.posts.lock().map_err(|e| e.to_string())?;
    
    let filtered: Vec<SocialPost> = posts.iter()
        .filter(|p| {
            let status_match = status.as_ref()
                .map(|s| format!("{:?}", p.status).to_lowercase() == s.to_lowercase())
                .unwrap_or(true);
            let platform_match = platform.as_ref()
                .map(|plat| {
                    p.platforms.iter().any(|pp| {
                        format!("{:?}", pp).to_lowercase() == plat.to_lowercase()
                    })
                })
                .unwrap_or(true);
            status_match && platform_match
        })
        .cloned()
        .collect();

    Ok(filtered)
}

#[command]
pub async fn social_get_post(
    state: tauri::State<'_, SocialState>,
    post_id: String,
) -> Result<SocialPost, String> {
    let posts = state.posts.lock().map_err(|e| e.to_string())?;
    
    posts.iter()
        .find(|p| p.id == post_id)
        .cloned()
        .ok_or_else(|| format!("Post not found: {}", post_id))
}

#[command]
pub async fn social_update_post(
    state: tauri::State<'_, SocialState>,
    post_id: String,
    content: Option<String>,
    hashtags: Option<Vec<String>>,
    media_urls: Option<Vec<String>>,
) -> Result<SocialPost, String> {
    let mut posts = state.posts.lock().map_err(|e| e.to_string())?;
    
    let post = posts.iter_mut()
        .find(|p| p.id == post_id)
        .ok_or_else(|| format!("Post not found: {}", post_id))?;

    if let Some(c) = content { post.content = c; }
    if let Some(h) = hashtags { post.hashtags = h; }
    if let Some(m) = media_urls { post.media_urls = m; }
    post.updated_at = Utc::now().to_rfc3339();

    Ok(post.clone())
}

#[command]
pub async fn social_delete_post(
    state: tauri::State<'_, SocialState>,
    post_id: String,
) -> Result<bool, String> {
    let mut posts = state.posts.lock().map_err(|e| e.to_string())?;
    let initial_len = posts.len();
    posts.retain(|p| p.id != post_id);
    
    Ok(posts.len() < initial_len)
}

#[command]
pub async fn social_schedule_post(
    state: tauri::State<'_, SocialState>,
    post_id: String,
    scheduled_at: String,
) -> Result<SocialPost, String> {
    let mut posts = state.posts.lock().map_err(|e| e.to_string())?;
    
    let post = posts.iter_mut()
        .find(|p| p.id == post_id)
        .ok_or_else(|| format!("Post not found: {}", post_id))?;

    post.scheduled_at = Some(scheduled_at);
    post.status = PostStatus::Scheduled;
    post.updated_at = Utc::now().to_rfc3339();

    Ok(post.clone())
}

#[command]
pub async fn social_publish_post(
    state: tauri::State<'_, SocialState>,
    post_id: String,
) -> Result<SocialPost, String> {
    let mut posts = state.posts.lock().map_err(|e| e.to_string())?;
    
    let post = posts.iter_mut()
        .find(|p| p.id == post_id)
        .ok_or_else(|| format!("Post not found: {}", post_id))?;

    post.status = PostStatus::Published;
    post.published_at = Some(Utc::now().to_rfc3339());
    post.updated_at = Utc::now().to_rfc3339();

    // Simulate initial analytics
    post.analytics = PostAnalytics {
        impressions: rand::random::<u64>() % 10000,
        reach: rand::random::<u64>() % 5000,
        engagements: rand::random::<u64>() % 500,
        likes: rand::random::<u64>() % 300,
        comments: rand::random::<u64>() % 50,
        shares: rand::random::<u64>() % 30,
        saves: rand::random::<u64>() % 20,
        clicks: rand::random::<u64>() % 100,
        video_views: 0,
        watch_time: 0,
        engagement_rate: (rand::random::<f64>() * 10.0).min(10.0),
        click_through_rate: (rand::random::<f64>() * 5.0).min(5.0),
    };

    Ok(post.clone())
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO PROJECT COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn social_create_video_project(
    state: tauri::State<'_, SocialState>,
    name: String,
    description: String,
    project_type: String,
    aspect_ratio: String,
) -> Result<VideoProject, String> {
    let project_type_enum = match project_type.to_lowercase().as_str() {
        "short" => VideoProjectType::Short,
        "reel" => VideoProjectType::Reel,
        "tiktok" => VideoProjectType::TikTok,
        "story" => VideoProjectType::Story,
        _ => VideoProjectType::Standard,
    };

    let project = VideoProject {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        description,
        project_type: project_type_enum,
        status: VideoStatus::Draft,
        duration_seconds: 0,
        aspect_ratio,
        scenes: Vec::new(),
        audio_tracks: Vec::new(),
        captions: Vec::new(),
        thumbnail_url: None,
        output_url: None,
        platforms: Vec::new(),
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };

    let mut projects = state.video_projects.lock().map_err(|e| e.to_string())?;
    projects.push(project.clone());

    Ok(project)
}

#[command]
pub async fn social_get_video_projects(
    state: tauri::State<'_, SocialState>,
    status: Option<String>,
) -> Result<Vec<VideoProject>, String> {
    let projects = state.video_projects.lock().map_err(|e| e.to_string())?;
    
    let filtered: Vec<VideoProject> = if let Some(s) = status {
        projects.iter()
            .filter(|p| format!("{:?}", p.status).to_lowercase() == s.to_lowercase())
            .cloned()
            .collect()
    } else {
        projects.clone()
    };

    Ok(filtered)
}

#[command]
pub async fn social_get_video_project(
    state: tauri::State<'_, SocialState>,
    project_id: String,
) -> Result<VideoProject, String> {
    let projects = state.video_projects.lock().map_err(|e| e.to_string())?;
    
    projects.iter()
        .find(|p| p.id == project_id)
        .cloned()
        .ok_or_else(|| format!("Project not found: {}", project_id))
}

#[command]
pub async fn social_add_video_scene(
    state: tauri::State<'_, SocialState>,
    project_id: String,
    duration_ms: u64,
    media_url: Option<String>,
    text: Option<String>,
) -> Result<VideoProject, String> {
    let mut projects = state.video_projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    let order = project.scenes.len() as u32 + 1;
    let text_overlay = text.map(|t| TextOverlay {
        text: t,
        font: "Inter".to_string(),
        size: 32,
        color: "#FFFFFF".to_string(),
        position: Position { x: 0.5, y: 0.5 },
        animation: None,
    });

    let scene = VideoScene {
        id: uuid::Uuid::new_v4().to_string(),
        order,
        duration_ms,
        media_url,
        text_overlay,
        transitions: Vec::new(),
        effects: Vec::new(),
    };

    project.scenes.push(scene);
    project.duration_seconds = project.scenes.iter().map(|s| s.duration_ms).sum::<u64>() / 1000;
    project.updated_at = Utc::now().to_rfc3339();

    Ok(project.clone())
}

#[command]
pub async fn social_render_video(
    state: tauri::State<'_, SocialState>,
    project_id: String,
) -> Result<VideoProject, String> {
    let mut projects = state.video_projects.lock().map_err(|e| e.to_string())?;
    
    let project = projects.iter_mut()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    project.status = VideoStatus::Rendering;
    project.updated_at = Utc::now().to_rfc3339();

    // Simulate rendering completion
    project.status = VideoStatus::Completed;
    project.output_url = Some(format!("/videos/{}.mp4", project.id));

    Ok(project.clone())
}

#[command]
pub async fn social_delete_video_project(
    state: tauri::State<'_, SocialState>,
    project_id: String,
) -> Result<bool, String> {
    let mut projects = state.video_projects.lock().map_err(|e| e.to_string())?;
    let initial_len = projects.len();
    projects.retain(|p| p.id != project_id);
    
    Ok(projects.len() < initial_len)
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn social_get_analytics(
    state: tauri::State<'_, SocialState>,
    period: String,
    platform: Option<String>,
) -> Result<SocialAnalytics, String> {
    let posts = state.posts.lock().map_err(|e| e.to_string())?;
    let accounts = state.accounts.lock().map_err(|e| e.to_string())?;

    let published_posts: Vec<&SocialPost> = posts.iter()
        .filter(|p| matches!(p.status, PostStatus::Published))
        .filter(|p| {
            platform.as_ref().map(|plat| {
                p.platforms.iter().any(|pp| format!("{:?}", pp).to_lowercase() == plat.to_lowercase())
            }).unwrap_or(true)
        })
        .collect();

    let total_impressions: u64 = published_posts.iter().map(|p| p.analytics.impressions).sum();
    let total_reach: u64 = published_posts.iter().map(|p| p.analytics.reach).sum();
    let total_engagements: u64 = published_posts.iter().map(|p| p.analytics.engagements).sum();
    let total_followers: u64 = accounts.iter().map(|a| a.followers).sum();

    let avg_engagement_rate = if published_posts.len() > 0 {
        published_posts.iter().map(|p| p.analytics.engagement_rate).sum::<f64>() / published_posts.len() as f64
    } else {
        0.0
    };

    // Aggregate hashtag performance
    let mut hashtag_map: HashMap<String, (u64, u64, u64)> = HashMap::new();
    for post in &published_posts {
        for hashtag in &post.hashtags {
            let entry = hashtag_map.entry(hashtag.clone()).or_insert((0, 0, 0));
            entry.0 += 1; // uses
            entry.1 += post.analytics.reach;
            entry.2 += post.analytics.engagements;
        }
    }

    let top_hashtags: Vec<HashtagMetrics> = hashtag_map.into_iter()
        .map(|(h, (uses, reach, engagement))| HashtagMetrics {
            hashtag: h,
            uses,
            reach,
            engagement,
        })
        .collect();

    let mut content_performance = HashMap::new();
    content_performance.insert("image".to_string(), ContentMetrics {
        content_type: "image".to_string(),
        posts: published_posts.iter().filter(|p| matches!(p.content_type, ContentType::Image)).count() as u64,
        avg_engagement: 5.2,
        total_reach: total_reach / 2,
    });
    content_performance.insert("video".to_string(), ContentMetrics {
        content_type: "video".to_string(),
        posts: published_posts.iter().filter(|p| matches!(p.content_type, ContentType::Video | ContentType::Reel | ContentType::Short)).count() as u64,
        avg_engagement: 8.5,
        total_reach: total_reach / 3,
    });

    let mut age_groups = HashMap::new();
    age_groups.insert("18-24".to_string(), 25.0);
    age_groups.insert("25-34".to_string(), 35.0);
    age_groups.insert("35-44".to_string(), 22.0);
    age_groups.insert("45-54".to_string(), 12.0);
    age_groups.insert("55+".to_string(), 6.0);

    let mut gender = HashMap::new();
    gender.insert("male".to_string(), 48.0);
    gender.insert("female".to_string(), 50.0);
    gender.insert("other".to_string(), 2.0);

    Ok(SocialAnalytics {
        period,
        platform: platform.and_then(|p| match p.to_lowercase().as_str() {
            "twitter" => Some(SocialPlatform::Twitter),
            "instagram" => Some(SocialPlatform::Instagram),
            "facebook" => Some(SocialPlatform::Facebook),
            "linkedin" => Some(SocialPlatform::LinkedIn),
            "tiktok" => Some(SocialPlatform::TikTok),
            _ => None,
        }),
        total_posts: published_posts.len() as u64,
        total_impressions,
        total_reach,
        total_engagements,
        total_followers,
        followers_growth: (rand::random::<i64>() % 500).abs(),
        avg_engagement_rate,
        best_posting_times: vec![
            "09:00".to_string(),
            "12:00".to_string(),
            "18:00".to_string(),
            "21:00".to_string(),
        ],
        top_hashtags,
        content_performance,
        audience_demographics: AudienceDemographics {
            age_groups,
            gender,
            top_locations: vec![
                LocationMetrics { location: "United States".to_string(), percentage: 35.0, count: 35000 },
                LocationMetrics { location: "United Kingdom".to_string(), percentage: 15.0, count: 15000 },
                LocationMetrics { location: "Canada".to_string(), percentage: 10.0, count: 10000 },
            ],
            interests: vec!["Technology".to_string(), "Business".to_string(), "Marketing".to_string()],
            active_times: HashMap::new(),
        },
    })
}

#[command]
pub async fn social_get_stats(
    state: tauri::State<'_, SocialState>,
) -> Result<HashMap<String, u64>, String> {
    let accounts = state.accounts.lock().map_err(|e| e.to_string())?;
    let posts = state.posts.lock().map_err(|e| e.to_string())?;
    let projects = state.video_projects.lock().map_err(|e| e.to_string())?;

    let mut stats = HashMap::new();
    stats.insert("connected_accounts".to_string(), accounts.len() as u64);
    stats.insert("total_followers".to_string(), accounts.iter().map(|a| a.followers).sum());
    stats.insert("total_posts".to_string(), posts.len() as u64);
    stats.insert("published_posts".to_string(), posts.iter().filter(|p| matches!(p.status, PostStatus::Published)).count() as u64);
    stats.insert("scheduled_posts".to_string(), posts.iter().filter(|p| matches!(p.status, PostStatus::Scheduled)).count() as u64);
    stats.insert("draft_posts".to_string(), posts.iter().filter(|p| matches!(p.status, PostStatus::Draft)).count() as u64);
    stats.insert("video_projects".to_string(), projects.len() as u64);
    stats.insert("total_engagements".to_string(), posts.iter().map(|p| p.analytics.engagements).sum());

    Ok(stats)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRENDING & SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

#[command]
pub async fn social_get_trending(
    _platform: Option<String>,
) -> Result<Vec<TrendingTopic>, String> {
    // Return simulated trending topics
    let topics = vec![
        TrendingTopic {
            id: uuid::Uuid::new_v4().to_string(),
            name: "AI Technology".to_string(),
            hashtag: Some("#AI".to_string()),
            volume: 1250000,
            change_percent: 15.5,
            platforms: vec![SocialPlatform::Twitter, SocialPlatform::LinkedIn],
            category: "Technology".to_string(),
        },
        TrendingTopic {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Sustainable Business".to_string(),
            hashtag: Some("#Sustainability".to_string()),
            volume: 850000,
            change_percent: 22.0,
            platforms: vec![SocialPlatform::Instagram, SocialPlatform::LinkedIn],
            category: "Business".to_string(),
        },
        TrendingTopic {
            id: uuid::Uuid::new_v4().to_string(),
            name: "Remote Work".to_string(),
            hashtag: Some("#RemoteWork".to_string()),
            volume: 650000,
            change_percent: 8.3,
            platforms: vec![SocialPlatform::Twitter, SocialPlatform::LinkedIn],
            category: "Work".to_string(),
        },
    ];

    Ok(topics)
}

#[command]
pub async fn social_get_content_suggestions(
    _platform: String,
    _topic: Option<String>,
) -> Result<Vec<ContentSuggestion>, String> {
    let suggestions = vec![
        ContentSuggestion {
            id: uuid::Uuid::new_v4().to_string(),
            suggestion_type: "trending".to_string(),
            content: "Share your thoughts on the latest AI developments and how they're transforming your industry.".to_string(),
            hashtags: vec!["#AI".to_string(), "#Innovation".to_string(), "#Technology".to_string()],
            best_time: "09:00 AM".to_string(),
            predicted_engagement: 7.5,
            platforms: vec![SocialPlatform::LinkedIn, SocialPlatform::Twitter],
        },
        ContentSuggestion {
            id: uuid::Uuid::new_v4().to_string(),
            suggestion_type: "engagement".to_string(),
            content: "Ask your audience: What's the biggest challenge you're facing this week?".to_string(),
            hashtags: vec!["#Community".to_string(), "#Engagement".to_string()],
            best_time: "12:00 PM".to_string(),
            predicted_engagement: 9.2,
            platforms: vec![SocialPlatform::Instagram, SocialPlatform::Twitter],
        },
        ContentSuggestion {
            id: uuid::Uuid::new_v4().to_string(),
            suggestion_type: "educational".to_string(),
            content: "5 Quick Tips to Boost Your Productivity Today 📈".to_string(),
            hashtags: vec!["#Productivity".to_string(), "#Tips".to_string(), "#Success".to_string()],
            best_time: "06:00 PM".to_string(),
            predicted_engagement: 6.8,
            platforms: vec![SocialPlatform::Instagram, SocialPlatform::TikTok],
        },
    ];

    Ok(suggestions)
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialNotification {
    pub id: String,
    #[serde(rename = "type")]
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub timestamp: String,
    pub read: bool,
}

#[command]
pub async fn social_get_notifications(
    state: tauri::State<'_, SocialState>,
) -> Result<Vec<SocialNotification>, String> {
    let accounts = state.accounts.lock().map_err(|e| e.to_string())?;
    let posts = state.posts.lock().map_err(|e| e.to_string())?;
    
    let mut notifications = Vec::new();
    let now = chrono::Utc::now();
    
    // Check for high-engagement posts
    for post in posts.iter() {
        let engagement = post.analytics.likes + post.analytics.comments + post.analytics.shares;
        if engagement > 100 {
            notifications.push(SocialNotification {
                id: format!("high-engagement-{}", post.id),
                notification_type: "post".to_string(),
                title: "High Engagement".to_string(),
                message: format!("Your post has {} interactions!", engagement),
                timestamp: post.created_at.clone(),
                read: false,
            });
        }
    }
    
    // Check for accounts needing attention
    for account in accounts.iter() {
        if !account.is_connected {
            notifications.push(SocialNotification {
                id: format!("reconnect-{}", account.id),
                notification_type: "account".to_string(),
                title: "Reconnect Account".to_string(),
                message: format!("{:?} account needs reconnection", account.platform),
                timestamp: now.to_rfc3339(),
                read: false,
            });
        }
    }
    
    // Scheduled posts reminder
    let scheduled_count = posts.iter()
        .filter(|p| matches!(p.status, PostStatus::Scheduled))
        .count();
    
    if scheduled_count > 0 {
        notifications.push(SocialNotification {
            id: format!("scheduled-{}", now.timestamp()),
            notification_type: "schedule".to_string(),
            title: "Scheduled Posts".to_string(),
            message: format!("{} posts scheduled to publish", scheduled_count),
            timestamp: now.to_rfc3339(),
            read: true,
        });
    }
    
    notifications.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    notifications.truncate(10);
    
    Ok(notifications)
}
