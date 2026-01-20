use chrono::Utc;
/**
 * 🤖 AI TRAINING SYSTEM
 *
 * Sistema completo para entrenar workflows y dar control total del browser a la IA:
 *
 * 1. **Recording Mode**: Graba acciones del usuario (clicks, typing, navigation, waits)
 * 2. **Workflow Storage**: Guarda sequences de training con contexto completo
 * 3. **AI Analysis**: Envía workflow a GPT-5.2 para análisis y optimización
 * 4. **Execution Engine**: Reproduce workflows aprendidos con control total del browser
 * 5. **Learning by Demonstration**: La IA aprende viendo al usuario
 */
use enigo::{Axis, Button, Coordinate, Direction, Enigo, Keyboard, Mouse, Settings};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::State;
use uuid::Uuid;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ActionType {
    Click,
    Type,
    Navigate,
    Wait,
    Scroll,
    Extract,
    Validate,
    Screenshot,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PageContext {
    pub url: String,
    pub title: String,
    pub timestamp: String,
    pub viewport: Viewport,
    pub dom_snapshot: Option<String>, // Snapshot simplificado del DOM
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Viewport {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionStep {
    pub id: String,
    pub action_type: ActionType,
    pub selector: Option<String>,        // CSS selector del elemento
    pub value: Option<String>,           // Valor para type, navigate, etc.
    pub position: Option<Position>,      // Posición del click
    pub duration: Option<u64>,           // Duración del wait (ms)
    pub expected_result: Option<String>, // Resultado esperado
    pub context: PageContext,
    pub timestamp: String,
    pub description: String, // Descripción generada por AI
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Position {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrainingSequence {
    pub id: String,
    pub name: String,
    pub description: String,
    pub steps: Vec<ActionStep>,
    pub category: String, // "form_fill", "data_extraction", "navigation", etc.
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub execution_count: u32,
    pub success_rate: f32,     // % de ejecuciones exitosas
    pub average_duration: u64, // Duración promedio en ms
    pub ai_analysis: Option<AIAnalysis>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIAnalysis {
    pub summary: String,
    pub optimization_suggestions: Vec<String>,
    pub confidence_score: f32,
    pub potential_improvements: Vec<String>,
    pub generated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum RecordingStatus {
    Idle,
    Recording,
    Paused,
    Executing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordingSession {
    pub id: String,
    pub status: RecordingStatus,
    pub steps: Vec<ActionStep>,
    pub started_at: String,
    pub current_step: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionResult {
    pub workflow_id: String,
    pub success: bool,
    pub steps_completed: usize,
    pub steps_failed: usize,
    pub duration_ms: u64,
    pub errors: Vec<String>,
    pub screenshots: Vec<String>, // Paths a screenshots capturados
    pub completed_at: String,
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════

pub struct AITrainerState {
    workflows: Mutex<HashMap<String, TrainingSequence>>,
    current_recording: Mutex<Option<RecordingSession>>,
    execution_history: Mutex<Vec<ExecutionResult>>,
}

impl AITrainerState {
    pub fn new() -> Self {
        Self {
            workflows: Mutex::new(HashMap::new()),
            current_recording: Mutex::new(None),
            execution_history: Mutex::new(Vec::new()),
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 1. START RECORDING
 * Inicia grabación de un nuevo workflow
 */
#[tauri::command]
pub async fn start_ai_recording(
    state: State<'_, AITrainerState>,
) -> Result<RecordingSession, String> {
    let mut recording = state.current_recording.lock().unwrap();

    // Verificar que no haya grabación activa
    if let Some(ref session) = *recording {
        if matches!(session.status, RecordingStatus::Recording) {
            return Err("Ya hay una grabación activa".to_string());
        }
    }

    let session = RecordingSession {
        id: Uuid::new_v4().to_string(),
        status: RecordingStatus::Recording,
        steps: Vec::new(),
        started_at: Utc::now().to_rfc3339(),
        current_step: None,
    };

    *recording = Some(session.clone());

    Ok(session)
}

/**
 * 2. ADD STEP TO RECORDING
 * Agrega un paso a la grabación actual
 */
#[tauri::command]
pub async fn add_recording_step(
    state: State<'_, AITrainerState>,
    action_type: ActionType,
    selector: Option<String>,
    value: Option<String>,
    position: Option<Position>,
    duration: Option<u64>,
    expected_result: Option<String>,
    page_context: PageContext,
    description: String,
) -> Result<(), String> {
    let mut recording = state.current_recording.lock().unwrap();

    let session = recording.as_mut().ok_or("No hay grabación activa")?;

    if !matches!(session.status, RecordingStatus::Recording) {
        return Err("La grabación no está activa".to_string());
    }

    let step = ActionStep {
        id: Uuid::new_v4().to_string(),
        action_type,
        selector,
        value,
        position,
        duration,
        expected_result,
        context: page_context,
        timestamp: Utc::now().to_rfc3339(),
        description,
    };

    session.steps.push(step);

    Ok(())
}

/**
 * 3. STOP RECORDING
 * Detiene grabación y retorna los pasos capturados
 */
#[tauri::command]
pub async fn stop_ai_recording(
    state: State<'_, AITrainerState>,
) -> Result<Vec<ActionStep>, String> {
    let mut recording = state.current_recording.lock().unwrap();

    let session = recording.as_mut().ok_or("No hay grabación activa")?;

    session.status = RecordingStatus::Idle;
    let steps = session.steps.clone();

    Ok(steps)
}

/**
 * 4. SAVE WORKFLOW
 * Guarda un workflow completo con metadatos
 */
#[tauri::command]
pub async fn save_workflow(
    state: State<'_, AITrainerState>,
    name: String,
    description: String,
    steps: Vec<ActionStep>,
    category: String,
    tags: Vec<String>,
) -> Result<TrainingSequence, String> {
    let mut workflows = state.workflows.lock().unwrap();

    if steps.is_empty() {
        return Err("El workflow debe tener al menos un paso".to_string());
    }

    let workflow = TrainingSequence {
        id: Uuid::new_v4().to_string(),
        name,
        description,
        steps,
        category,
        tags,
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
        execution_count: 0,
        success_rate: 0.0,
        average_duration: 0,
        ai_analysis: None,
    };

    workflows.insert(workflow.id.clone(), workflow.clone());

    Ok(workflow)
}

/**
 * 5. LIST WORKFLOWS
 * Lista todos los workflows guardados
 */
#[tauri::command]
pub async fn list_workflows(
    state: State<'_, AITrainerState>,
    category: Option<String>,
    tag: Option<String>,
) -> Result<Vec<TrainingSequence>, String> {
    let workflows = state.workflows.lock().unwrap();

    let mut result: Vec<TrainingSequence> = workflows.values().cloned().collect();

    // Filtrar por categoría si se especifica
    if let Some(cat) = category {
        result.retain(|w| w.category == cat);
    }

    // Filtrar por tag si se especifica
    if let Some(t) = tag {
        result.retain(|w| w.tags.contains(&t));
    }

    // Ordenar por fecha de creación (más reciente primero)
    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(result)
}

/**
 * 6. GET WORKFLOW
 * Obtiene detalles de un workflow específico
 */
#[tauri::command]
pub async fn get_workflow(
    state: State<'_, AITrainerState>,
    workflow_id: String,
) -> Result<TrainingSequence, String> {
    let workflows = state.workflows.lock().unwrap();

    workflows
        .get(&workflow_id)
        .cloned()
        .ok_or_else(|| format!("Workflow {} no encontrado", workflow_id))
}

/**
 * 7. DELETE WORKFLOW
 * Elimina un workflow
 */
#[tauri::command]
pub async fn delete_workflow(
    state: State<'_, AITrainerState>,
    workflow_id: String,
) -> Result<(), String> {
    let mut workflows = state.workflows.lock().unwrap();

    workflows
        .remove(&workflow_id)
        .ok_or_else(|| format!("Workflow {} no encontrado", workflow_id))?;

    Ok(())
}

/**
 * 8. EXECUTE WORKFLOW
 * Ejecuta un workflow con simulación real de input usando enigo
 */
#[tauri::command]
pub async fn execute_workflow(
    state: State<'_, AITrainerState>,
    workflow_id: String,
) -> Result<ExecutionResult, String> {
    let start_time = Instant::now();
    
    // Get workflow
    let workflow = {
        let workflows = state.workflows.lock().unwrap();
        workflows
            .get(&workflow_id)
            .cloned()
            .ok_or_else(|| format!("Workflow {} no encontrado", workflow_id))?
    };

    // Clone steps for use in blocking task
    let steps = workflow.steps.clone();

    // Execute all enigo operations in a blocking task (enigo is not Send)
    let (steps_completed, steps_failed, errors, screenshots) = tokio::task::spawn_blocking(move || {
        // Initialize enigo for input simulation
        let mut enigo = Enigo::new(&Settings::default())
            .map_err(|e| format!("Failed to initialize input simulator: {}", e))?;

        let mut steps_completed = 0;
        let mut steps_failed = 0;
        let mut errors: Vec<String> = Vec::new();
        let mut screenshots: Vec<String> = Vec::new();

        // Execute each step
        for (index, step) in steps.iter().enumerate() {
            match execute_action_step_sync(&mut enigo, step) {
                Ok(screenshot_path) => {
                    steps_completed += 1;
                    if let Some(path) = screenshot_path {
                        screenshots.push(path);
                    }
                }
                Err(e) => {
                    steps_failed += 1;
                    let error_msg = format!(
                        "Step {} ({:?}) failed: {}",
                        index + 1,
                        step.action_type,
                        e
                    );
                    errors.push(error_msg);
                    // Continue execution despite errors for robustness
                }
            }

            // Small delay between steps for system stability
            std::thread::sleep(Duration::from_millis(100));
        }

        Ok::<(usize, usize, Vec<String>, Vec<String>), String>((steps_completed, steps_failed, errors, screenshots))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))??;

    let duration_ms = start_time.elapsed().as_millis() as u64;
    let success = steps_failed == 0;

    let result = ExecutionResult {
        workflow_id: workflow_id.clone(),
        success,
        steps_completed,
        steps_failed,
        duration_ms,
        errors,
        screenshots,
        completed_at: Utc::now().to_rfc3339(),
    };

    // Update workflow statistics
    {
        let mut workflows = state.workflows.lock().unwrap();
        if let Some(wf) = workflows.get_mut(&workflow_id) {
            wf.execution_count += 1;
            wf.updated_at = Utc::now().to_rfc3339();

            // Calculate success rate
            let total_executions = wf.execution_count as f32;
            let successful_executions = if success {
                (wf.success_rate * (total_executions - 1.0)) + 1.0
            } else {
                wf.success_rate * (total_executions - 1.0)
            };
            wf.success_rate = successful_executions / total_executions;

            // Update average duration
            let total_duration = (wf.average_duration as f64 * (total_executions - 1.0) as f64)
                + duration_ms as f64;
            wf.average_duration = (total_duration / total_executions as f64) as u64;
        }
    }

    // Save to execution history
    {
        let mut history = state.execution_history.lock().unwrap();
        history.push(result.clone());
    }

    Ok(result)
}

/// Execute a single action step with real input simulation (synchronous version for spawn_blocking)
fn execute_action_step_sync(
    enigo: &mut Enigo,
    step: &ActionStep,
) -> Result<Option<String>, String> {
    // Apply wait duration if specified
    if let Some(wait_ms) = step.duration {
        if wait_ms > 0 {
            let capped_wait = wait_ms.min(30000); // Cap at 30 seconds
            std::thread::sleep(Duration::from_millis(capped_wait));
        }
    }

    match step.action_type {
        ActionType::Click => {
            // Use position if provided, otherwise use selector (logging only - selector execution requires browser)
            if let Some(ref pos) = step.position {
                enigo
                    .move_mouse(pos.x, pos.y, Coordinate::Abs)
                    .map_err(|e| format!("Failed to move mouse: {}", e))?;
                std::thread::sleep(Duration::from_millis(50));
                enigo
                    .button(Button::Left, Direction::Click)
                    .map_err(|e| format!("Failed to click: {}", e))?;
            } else if step.selector.is_some() {
                // Log warning - selector-based clicks require browser integration
                return Err("Selector-based clicks require browser integration".to_string());
            }
        }
        ActionType::Type => {
            if let Some(ref text) = step.value {
                // If we have a click target, click first
                if let Some(ref pos) = step.position {
                    enigo
                        .move_mouse(pos.x, pos.y, Coordinate::Abs)
                        .map_err(|e| format!("Failed to move mouse: {}", e))?;
                    std::thread::sleep(Duration::from_millis(50));
                    enigo
                        .button(Button::Left, Direction::Click)
                        .map_err(|e| format!("Failed to click before typing: {}", e))?;
                    std::thread::sleep(Duration::from_millis(100));
                }
                
                enigo
                    .text(text)
                    .map_err(|e| format!("Failed to type text: {}", e))?;
            }
        }
        ActionType::Navigate => {
            // Navigation requires browser - open URL using system
            if let Some(ref url) = step.value {
                #[cfg(target_os = "macos")]
                {
                    std::process::Command::new("open")
                        .arg(url)
                        .spawn()
                        .map_err(|e| format!("Failed to open URL: {}", e))?;
                }
                #[cfg(target_os = "windows")]
                {
                    std::process::Command::new("cmd")
                        .args(["/c", "start", url])
                        .spawn()
                        .map_err(|e| format!("Failed to open URL: {}", e))?;
                }
                #[cfg(target_os = "linux")]
                {
                    std::process::Command::new("xdg-open")
                        .arg(url)
                        .spawn()
                        .map_err(|e| format!("Failed to open URL: {}", e))?;
                }
                // Wait for page to start loading
                std::thread::sleep(Duration::from_millis(2000));
            }
        }
        ActionType::Wait => {
            // Duration already handled above, but explicit wait action
            let wait_ms = step.duration.unwrap_or(1000);
            let capped_wait = wait_ms.min(30000);
            std::thread::sleep(Duration::from_millis(capped_wait));
        }
        ActionType::Scroll => {
            // Parse scroll amount from value
            let scroll_amount: i32 = step
                .value
                .as_ref()
                .and_then(|v| v.parse().ok())
                .unwrap_or(3);

            // Move to position if specified
            if let Some(ref pos) = step.position {
                enigo
                    .move_mouse(pos.x, pos.y, Coordinate::Abs)
                    .map_err(|e| format!("Failed to move mouse: {}", e))?;
                std::thread::sleep(Duration::from_millis(50));
            }

            enigo
                .scroll(scroll_amount, Axis::Vertical)
                .map_err(|e| format!("Failed to scroll: {}", e))?;
        }
        ActionType::Extract => {
            // Extraction requires browser integration
            return Err("Extract action requires browser integration".to_string());
        }
        ActionType::Validate => {
            // Validation requires browser integration to check element state
            return Err("Validate action requires browser integration".to_string());
        }
        ActionType::Screenshot => {
            // Use screenshots crate for screen capture
            let screens = screenshots::Screen::all()
                .map_err(|e| format!("Failed to get screens: {}", e))?;

            if let Some(screen) = screens.first() {
                let image = screen
                    .capture()
                    .map_err(|e| format!("Failed to capture screenshot: {}", e))?;

                // Save to temp directory
                let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
                let screenshot_dir = std::env::temp_dir().join("cube_screenshots");
                std::fs::create_dir_all(&screenshot_dir)
                    .map_err(|e| format!("Failed to create screenshot directory: {}", e))?;

                let path = screenshot_dir.join(format!("workflow_{}_{}.png", step.id, timestamp));
                image
                    .save(&path)
                    .map_err(|e| format!("Failed to save screenshot: {}", e))?;

                return Ok(Some(path.to_string_lossy().to_string()));
            }
        }
        ActionType::Custom => {
            // Custom actions - parse from value
            if let Some(ref custom_action) = step.value {
                // Parse JSON custom action
                if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(custom_action) {
                    if let Some(action_type) = parsed.get("type").and_then(|v| v.as_str()) {
                        match action_type {
                            "double_click" => {
                                if let Some(ref pos) = step.position {
                                    enigo
                                        .move_mouse(pos.x, pos.y, Coordinate::Abs)
                                        .map_err(|e| format!("Failed to move: {}", e))?;
                                }
                                enigo
                                    .button(Button::Left, Direction::Click)
                                    .map_err(|e| format!("Failed to double click (1): {}", e))?;
                                std::thread::sleep(Duration::from_millis(50));
                                enigo
                                    .button(Button::Left, Direction::Click)
                                    .map_err(|e| format!("Failed to double click (2): {}", e))?;
                            }
                            "right_click" => {
                                if let Some(ref pos) = step.position {
                                    enigo
                                        .move_mouse(pos.x, pos.y, Coordinate::Abs)
                                        .map_err(|e| format!("Failed to move: {}", e))?;
                                }
                                enigo
                                    .button(Button::Right, Direction::Click)
                                    .map_err(|e| format!("Failed to right click: {}", e))?;
                            }
                            "key_press" => {
                                if let Some(key) = parsed.get("key").and_then(|v| v.as_str()) {
                                    // Use simple text for key presses
                                    enigo
                                        .text(key)
                                        .map_err(|e| format!("Failed to press key: {}", e))?;
                                }
                            }
                            _ => {
                                return Err(format!("Unknown custom action: {}", action_type));
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(None)
}

/**
 * 9. ANALYZE WORKFLOW WITH AI
 * Envía workflow a OpenAI GPT para análisis profesional y optimización
 */
#[tauri::command]
pub async fn analyze_workflow_with_ai(
    state: State<'_, AITrainerState>,
    workflow_id: String,
) -> Result<AIAnalysis, String> {
    // Get workflow for analysis (clone to avoid holding lock during API call)
    let workflow = {
        let workflows = state.workflows.lock().unwrap();
        workflows
            .get(&workflow_id)
            .cloned()
            .ok_or_else(|| format!("Workflow {} no encontrado", workflow_id))?
    };

    // Build workflow description for AI analysis
    let workflow_description = build_workflow_description(&workflow);

    // Get API key from environment
    let api_key = std::env::var("OPENAI_API_KEY")
        .map_err(|_| "OpenAI API key not configured. Set OPENAI_API_KEY environment variable.".to_string())?;

    // Build the analysis prompt
    let system_prompt = r#"You are an expert workflow automation analyst. Analyze the provided workflow and return a JSON response with the following structure:
{
    "summary": "A clear, concise summary of what the workflow does",
    "optimization_suggestions": ["Array of specific suggestions to optimize the workflow"],
    "confidence_score": 0.0-1.0 confidence in the analysis,
    "potential_improvements": ["Array of potential improvements or enhancements"]
}

Focus on:
1. Identifying redundant or unnecessary steps
2. Suggesting ways to make the workflow more robust
3. Recommending error handling improvements
4. Identifying potential race conditions or timing issues
5. Suggesting better selectors or interaction patterns

Respond ONLY with valid JSON, no additional text."#;

    let user_prompt = format!(
        "Analyze this automation workflow:\n\n{}\n\nProvide a detailed analysis in JSON format.",
        workflow_description
    );

    // Make OpenAI API call
    let client = reqwest::Client::new();
    
    let request_body = serde_json::json!({
        "model": "gpt-4-turbo-preview",
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user", 
                "content": user_prompt
            }
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
        "response_format": { "type": "json_object" }
    });

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to call OpenAI API: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("OpenAI API error: {}", error_text));
    }

    let response_json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

    // Extract the content from the response
    let content = response_json
        .get("choices")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .ok_or("Invalid response format from OpenAI")?;

    // Parse the AI response
    let ai_response: serde_json::Value = serde_json::from_str(content)
        .map_err(|e| format!("Failed to parse AI analysis JSON: {}", e))?;

    // Build the analysis result
    let analysis = AIAnalysis {
        summary: ai_response
            .get("summary")
            .and_then(|v| v.as_str())
            .unwrap_or(&format!(
                "Workflow '{}' contains {} steps for automated browser interaction.",
                workflow.name,
                workflow.steps.len()
            ))
            .to_string(),
        optimization_suggestions: ai_response
            .get("optimization_suggestions")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_else(|| vec![
                "Add explicit waits for element visibility".to_string(),
                "Implement retry logic for flaky actions".to_string(),
            ]),
        confidence_score: ai_response
            .get("confidence_score")
            .and_then(|v| v.as_f64())
            .map(|f| f as f32)
            .unwrap_or(0.8),
        potential_improvements: ai_response
            .get("potential_improvements")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_else(|| vec![
                "Add screenshots for debugging".to_string(),
                "Implement logging for each step".to_string(),
            ]),
        generated_at: Utc::now().to_rfc3339(),
    };

    // Update workflow with analysis
    {
        let mut workflows = state.workflows.lock().unwrap();
        if let Some(wf) = workflows.get_mut(&workflow_id) {
            wf.ai_analysis = Some(analysis.clone());
            wf.updated_at = Utc::now().to_rfc3339();
        }
    }

    Ok(analysis)
}

/// Build a human-readable description of the workflow for AI analysis
fn build_workflow_description(workflow: &TrainingSequence) -> String {
    let mut description = format!(
        "Workflow: {}\nDescription: {}\nCategory: {}\nTags: {}\n\nSteps ({} total):\n",
        workflow.name,
        workflow.description,
        workflow.category,
        workflow.tags.join(", "),
        workflow.steps.len()
    );

    for (i, step) in workflow.steps.iter().enumerate() {
        description.push_str(&format!(
            "\n{}. {} - {}\n",
            i + 1,
            format!("{:?}", step.action_type),
            step.description
        ));

        if let Some(ref selector) = step.selector {
            description.push_str(&format!("   Selector: {}\n", selector));
        }
        if let Some(ref value) = step.value {
            description.push_str(&format!("   Value: {}\n", value));
        }
        if let Some(ref pos) = step.position {
            description.push_str(&format!("   Position: ({}, {})\n", pos.x, pos.y));
        }
        if let Some(duration) = step.duration {
            description.push_str(&format!("   Wait: {}ms\n", duration));
        }
        description.push_str(&format!(
            "   Page: {} ({})\n",
            step.context.title, step.context.url
        ));
    }

    if workflow.execution_count > 0 {
        description.push_str(&format!(
            "\nExecution Statistics:\n- Total runs: {}\n- Success rate: {:.1}%\n- Average duration: {}ms\n",
            workflow.execution_count,
            workflow.success_rate * 100.0,
            workflow.average_duration
        ));
    }

    description
}

/**
 * 10. GET EXECUTION HISTORY
 * Obtiene historial de ejecuciones
 */
#[tauri::command]
pub async fn get_execution_history(
    state: State<'_, AITrainerState>,
    workflow_id: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<ExecutionResult>, String> {
    let history = state.execution_history.lock().unwrap();

    let mut results: Vec<ExecutionResult> = history.clone();

    // Filtrar por workflow si se especifica
    if let Some(id) = workflow_id {
        results.retain(|r| r.workflow_id == id);
    }

    // Limitar cantidad de resultados
    if let Some(lim) = limit {
        results.truncate(lim);
    }

    // Ordenar por fecha (más reciente primero)
    results.sort_by(|a, b| b.completed_at.cmp(&a.completed_at));

    Ok(results)
}

/**
 * 11. PAUSE RECORDING
 * Pausa la grabación actual
 */
#[tauri::command]
pub async fn pause_ai_recording(state: State<'_, AITrainerState>) -> Result<(), String> {
    let mut recording = state.current_recording.lock().unwrap();

    let session = recording.as_mut().ok_or("No hay grabación activa")?;

    if !matches!(session.status, RecordingStatus::Recording) {
        return Err("La grabación no está en modo Recording".to_string());
    }

    session.status = RecordingStatus::Paused;

    Ok(())
}

/**
 * 12. RESUME RECORDING
 * Reanuda la grabación pausada
 */
#[tauri::command]
pub async fn resume_ai_recording(state: State<'_, AITrainerState>) -> Result<(), String> {
    let mut recording = state.current_recording.lock().unwrap();

    let session = recording.as_mut().ok_or("No hay grabación activa")?;

    if !matches!(session.status, RecordingStatus::Paused) {
        return Err("La grabación no está pausada".to_string());
    }

    session.status = RecordingStatus::Recording;

    Ok(())
}

/**
 * 13. GET CURRENT RECORDING
 * Obtiene el estado actual de la grabación
 */
#[tauri::command]
pub async fn get_current_ai_recording(
    state: State<'_, AITrainerState>,
) -> Result<Option<RecordingSession>, String> {
    let recording = state.current_recording.lock().unwrap();
    Ok(recording.clone())
}

/**
 * 14. CLEAR RECORDING
 * Limpia la grabación actual sin guardar
 */
#[tauri::command]
pub async fn clear_ai_recording(state: State<'_, AITrainerState>) -> Result<(), String> {
    let mut recording = state.current_recording.lock().unwrap();
    *recording = None;
    Ok(())
}

/**
 * 15. UPDATE WORKFLOW
 * Actualiza un workflow existente
 */
#[tauri::command]
pub async fn update_workflow(
    state: State<'_, AITrainerState>,
    workflow_id: String,
    name: Option<String>,
    description: Option<String>,
    steps: Option<Vec<ActionStep>>,
    category: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<TrainingSequence, String> {
    let mut workflows = state.workflows.lock().unwrap();

    let workflow = workflows
        .get_mut(&workflow_id)
        .ok_or_else(|| format!("Workflow {} no encontrado", workflow_id))?;

    if let Some(n) = name {
        workflow.name = n;
    }
    if let Some(d) = description {
        workflow.description = d;
    }
    if let Some(s) = steps {
        workflow.steps = s;
    }
    if let Some(c) = category {
        workflow.category = c;
    }
    if let Some(t) = tags {
        workflow.tags = t;
    }

    workflow.updated_at = Utc::now().to_rfc3339();

    Ok(workflow.clone())
}
