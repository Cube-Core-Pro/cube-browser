// ============================================================================
// KNOWLEDGE MODULE - Advanced Features Backend
// ============================================================================
// Templates, AI Agents, Graph View, Web Clipper, Canvas

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ============================================================================
// KNOWLEDGE TEMPLATES TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub icon: String,
    pub content: String,
    pub variables: Vec<String>,
    pub is_custom: bool,
    pub created_at: u64,
    pub usage_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplatesConfig {
    pub templates: Vec<KnowledgeTemplate>,
    pub categories: Vec<String>,
}

pub struct TemplatesState {
    config: Mutex<TemplatesConfig>,
}

impl Default for TemplatesState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(TemplatesConfig {
                categories: vec![String::from("Meeting"), String::from("Project"), String::from("Personal"), String::from("Research")],
                templates: vec![
                    KnowledgeTemplate { id: String::from("tpl-1"), name: String::from("Meeting Notes"), description: String::from("Template for meeting notes with attendees and action items"), category: String::from("Meeting"), icon: String::from("clipboard"), content: String::from("# {{meeting_title}}\n\n**Date:** {{date}}\n**Attendees:** {{attendees}}\n\n## Agenda\n- Item 1\n\n## Discussion\n\n## Action Items\n- [ ] Action 1"), variables: vec![String::from("meeting_title"), String::from("date"), String::from("attendees")], is_custom: false, created_at: now - 90 * 24 * 60 * 60, usage_count: 156 },
                    KnowledgeTemplate { id: String::from("tpl-2"), name: String::from("Project Brief"), description: String::from("Template for project documentation"), category: String::from("Project"), icon: String::from("folder"), content: String::from("# Project: {{project_name}}\n\n## Overview\n{{overview}}\n\n## Goals\n- Goal 1\n\n## Timeline\n\n## Resources"), variables: vec![String::from("project_name"), String::from("overview")], is_custom: false, created_at: now - 60 * 24 * 60 * 60, usage_count: 89 },
                    KnowledgeTemplate { id: String::from("tpl-3"), name: String::from("Daily Journal"), description: String::from("Template for daily journaling"), category: String::from("Personal"), icon: String::from("book"), content: String::from("# {{date}}\n\n## Today's Focus\n\n## Accomplishments\n\n## Reflections\n\n## Tomorrow's Goals"), variables: vec![String::from("date")], is_custom: false, created_at: now - 30 * 24 * 60 * 60, usage_count: 245 },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_templates_config(state: State<'_, TemplatesState>) -> Result<TemplatesConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn delete_template(template_id: String, state: State<'_, TemplatesState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.templates.retain(|t| t.id != template_id);
    Ok(())
}

// ============================================================================
// AI AGENTS TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIAgent {
    pub id: String,
    pub name: String,
    pub description: String,
    pub avatar: String,
    pub capabilities: Vec<String>,
    pub model: String,
    pub is_active: bool,
    pub created_at: u64,
    pub usage_count: u32,
    pub last_used: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIAgentsConfig {
    pub agents: Vec<AIAgent>,
}

pub struct AIAgentsState {
    config: Mutex<AIAgentsConfig>,
}

impl Default for AIAgentsState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(AIAgentsConfig {
                agents: vec![
                    AIAgent { id: String::from("agent-1"), name: String::from("Research Assistant"), description: String::from("Helps with research, fact-checking, and summarization"), avatar: String::from("🔍"), capabilities: vec![String::from("research"), String::from("summarize"), String::from("fact-check")], model: String::from("gpt-4"), is_active: true, created_at: now - 30 * 24 * 60 * 60, usage_count: 245, last_used: Some(now - 3600) },
                    AIAgent { id: String::from("agent-2"), name: String::from("Writing Coach"), description: String::from("Improves writing style, grammar, and clarity"), avatar: String::from("✍️"), capabilities: vec![String::from("edit"), String::from("improve"), String::from("suggest")], model: String::from("gpt-4"), is_active: true, created_at: now - 60 * 24 * 60 * 60, usage_count: 189, last_used: Some(now - 7200) },
                    AIAgent { id: String::from("agent-3"), name: String::from("Code Reviewer"), description: String::from("Reviews code, suggests improvements, finds bugs"), avatar: String::from("💻"), capabilities: vec![String::from("review"), String::from("debug"), String::from("optimize")], model: String::from("gpt-4-turbo"), is_active: false, created_at: now - 15 * 24 * 60 * 60, usage_count: 67, last_used: Some(now - 86400) },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_ai_agents_config(state: State<'_, AIAgentsState>) -> Result<AIAgentsConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn toggle_ai_agent(agent_id: String, active: bool, state: State<'_, AIAgentsState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    if let Some(agent) = config.agents.iter_mut().find(|a| a.id == agent_id) {
        agent.is_active = active;
    }
    Ok(())
}

// ============================================================================
// GRAPH VIEW TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphNode {
    pub id: String,
    pub label: String,
    pub node_type: String,
    pub x: f64,
    pub y: f64,
    pub connections: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphViewConfig {
    pub nodes: Vec<GraphNode>,
    pub zoom_level: f64,
    pub center_x: f64,
    pub center_y: f64,
}

pub struct GraphViewState {
    config: Mutex<GraphViewConfig>,
}

impl Default for GraphViewState {
    fn default() -> Self {
        Self {
            config: Mutex::new(GraphViewConfig {
                zoom_level: 1.0,
                center_x: 0.0,
                center_y: 0.0,
                nodes: vec![
                    GraphNode { id: String::from("node-1"), label: String::from("Project Overview"), node_type: String::from("document"), x: 0.0, y: 0.0, connections: vec![String::from("node-2"), String::from("node-3")] },
                    GraphNode { id: String::from("node-2"), label: String::from("Requirements"), node_type: String::from("document"), x: 200.0, y: -100.0, connections: vec![String::from("node-4")] },
                    GraphNode { id: String::from("node-3"), label: String::from("Architecture"), node_type: String::from("document"), x: 200.0, y: 100.0, connections: vec![String::from("node-5")] },
                    GraphNode { id: String::from("node-4"), label: String::from("User Stories"), node_type: String::from("folder"), x: 400.0, y: -100.0, connections: vec![] },
                    GraphNode { id: String::from("node-5"), label: String::from("Tech Stack"), node_type: String::from("tag"), x: 400.0, y: 100.0, connections: vec![] },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_graph_view_config(state: State<'_, GraphViewState>) -> Result<GraphViewConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

// ============================================================================
// WEB CLIPPER TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebClip {
    pub id: String,
    pub title: String,
    pub url: String,
    pub content: String,
    pub clip_type: String,
    pub tags: Vec<String>,
    pub created_at: u64,
    pub thumbnail: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebClipperConfig {
    pub clips: Vec<WebClip>,
    pub default_folder: String,
    pub auto_tag: bool,
}

pub struct WebClipperState {
    config: Mutex<WebClipperConfig>,
}

impl Default for WebClipperState {
    fn default() -> Self {
        let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
        Self {
            config: Mutex::new(WebClipperConfig {
                default_folder: String::from("Clips"),
                auto_tag: true,
                clips: vec![
                    WebClip { id: String::from("clip-1"), title: String::from("Introduction to Rust"), url: String::from("https://doc.rust-lang.org/book/"), content: String::from("The Rust Programming Language book..."), clip_type: String::from("article"), tags: vec![String::from("rust"), String::from("programming")], created_at: now - 24 * 60 * 60, thumbnail: None },
                    WebClip { id: String::from("clip-2"), title: String::from("React Hooks Guide"), url: String::from("https://react.dev/reference/react"), content: String::from("Built-in React Hooks documentation..."), clip_type: String::from("reference"), tags: vec![String::from("react"), String::from("javascript")], created_at: now - 48 * 60 * 60, thumbnail: None },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_web_clipper_config(state: State<'_, WebClipperState>) -> Result<WebClipperConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn delete_web_clip(clip_id: String, state: State<'_, WebClipperState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.clips.retain(|c| c.id != clip_id);
    Ok(())
}

// ============================================================================
// CANVAS TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasElement {
    pub id: String,
    pub element_type: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub content: String,
    pub style: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CanvasConfig {
    pub elements: Vec<CanvasElement>,
    pub background_color: String,
    pub grid_enabled: bool,
}

pub struct CanvasState {
    config: Mutex<CanvasConfig>,
}

impl Default for CanvasState {
    fn default() -> Self {
        Self {
            config: Mutex::new(CanvasConfig {
                background_color: String::from("#ffffff"),
                grid_enabled: true,
                elements: vec![
                    CanvasElement { id: String::from("el-1"), element_type: String::from("text"), x: 100.0, y: 100.0, width: 200.0, height: 50.0, content: String::from("Welcome to Canvas"), style: String::from("heading") },
                    CanvasElement { id: String::from("el-2"), element_type: String::from("note"), x: 100.0, y: 200.0, width: 300.0, height: 150.0, content: String::from("This is a note element. You can add any content here."), style: String::from("default") },
                    CanvasElement { id: String::from("el-3"), element_type: String::from("image"), x: 450.0, y: 100.0, width: 200.0, height: 200.0, content: String::from("placeholder"), style: String::from("default") },
                ],
            }),
        }
    }
}

#[tauri::command]
pub async fn get_canvas_config(state: State<'_, CanvasState>) -> Result<CanvasConfig, String> {
    state.config.lock().map(|c| c.clone()).map_err(|e| format!("Lock error: {}", e))
}

#[tauri::command]
pub async fn delete_canvas_element(element_id: String, state: State<'_, CanvasState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| format!("Lock error: {}", e))?;
    config.elements.retain(|e| e.id != element_id);
    Ok(())
}
