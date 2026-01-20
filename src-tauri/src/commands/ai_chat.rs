use async_openai::{
    types::{
        ChatCompletionRequestAssistantMessageArgs, ChatCompletionRequestMessage,
        ChatCompletionRequestSystemMessageArgs, ChatCompletionRequestUserMessageArgs,
        CreateChatCompletionRequestArgs,
    },
    Client,
};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{command, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub role: String, // "user" | "assistant" | "system"
    pub content: String,
    pub timestamp: i64,
    pub command_executed: Option<String>,
    pub action_result: Option<ActionResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResult {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatSession {
    pub id: String,
    pub messages: Vec<ChatMessage>,
    pub context: BrowserContext,
    pub created_at: i64,
    pub last_active: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserContext {
    pub current_url: String,
    pub current_title: String,
    pub tabs_count: u32,
    pub active_downloads: u32,
    pub last_command: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandSuggestion {
    pub command: String,
    pub description: String,
    pub example: String,
    pub category: String,
}

#[derive(Default)]
pub struct AIChatState {
    current_session: Mutex<Option<ChatSession>>,
    api_key: Mutex<Option<String>>,
    selected_model: Mutex<String>, // gpt-5.2, gpt-5-mini, gpt-5-nano, gpt-5-pro (current models)
}

impl AIChatState {
    pub fn new() -> Self {
        Self {
            current_session: Mutex::new(None),
            api_key: Mutex::new(None),
            selected_model: Mutex::new("gpt-5.2".to_string()), // Default to GPT-5.2 (most capable)
        }
    }
}

/// Start a new chat session
#[command]
pub async fn start_chat_session(state: State<'_, AIChatState>) -> Result<ChatSession, String> {
    let session = ChatSession {
        id: uuid::Uuid::new_v4().to_string(),
        messages: vec![ChatMessage {
            id: uuid::Uuid::new_v4().to_string(),
            role: "system".to_string(),
            content: "👋 ¡Hola! Soy tu asistente AI de CUBE Nexum Browser. Puedo ayudarte a:\n\n\
                    • 🌐 Navegar y controlar tabs del navegador\n\
                    • 📥 Gestionar descargas y archivos\n\
                    • 🤖 Ejecutar workflows de automatización\n\
                    • 🏦 Automatizar formularios y aplicaciones web\n\
                    • 📸 Capturar screenshots y grabar pantalla\n\
                    • 🎬 Crear y ejecutar macros personalizadas\n\
                    • 🔍 Extraer datos de páginas web\n\
                    • 💡 Sugerir selectores CSS inteligentes\n\n\
                    Tengo acceso completo al DOM y todas las herramientas del navegador. \n\
                    ¿En qué puedo ayudarte hoy?"
                .to_string(),
            timestamp: chrono::Utc::now().timestamp_millis(),
            command_executed: None,
            action_result: None,
        }],
        context: BrowserContext {
            current_url: String::new(),
            current_title: String::new(),
            tabs_count: 0,
            active_downloads: 0,
            last_command: None,
        },
        created_at: chrono::Utc::now().timestamp_millis(),
        last_active: chrono::Utc::now().timestamp_millis(),
    };

    let mut current = state.current_session.lock().unwrap();
    *current = Some(session.clone());

    Ok(session)
}

/// Send a message to the AI chat
#[command]
pub async fn send_chat_message(
    message: String,
    state: State<'_, AIChatState>,
) -> Result<ChatMessage, String> {
    // Add user message first
    let (session_exists, user_message_id) = {
        let mut current = state.current_session.lock().unwrap();

        if current.is_none() {
            return Err("No active chat session. Please start a session first.".to_string());
        }

        let session = current.as_mut().unwrap();

        // Add user message
        let user_message = ChatMessage {
            id: uuid::Uuid::new_v4().to_string(),
            role: "user".to_string(),
            content: message.clone(),
            timestamp: chrono::Utc::now().timestamp_millis(),
            command_executed: None,
            action_result: None,
        };
        session.messages.push(user_message.clone());

        (true, user_message.id.clone())
    }; // Lock released here

    // Log session status
    if session_exists {
        log::debug!(
            "Processing message in existing session: {}",
            user_message_id
        );
    }

    // Parse natural language and generate AI response (no lock held)
    let (response_text, command_executed, action_result) =
        generate_ai_response(&message, &state).await;

    // Add assistant message
    let assistant_message = {
        let mut current = state.current_session.lock().unwrap();
        let session = current.as_mut().unwrap();

        let assistant_message = ChatMessage {
            id: uuid::Uuid::new_v4().to_string(),
            role: "assistant".to_string(),
            content: response_text,
            timestamp: chrono::Utc::now().timestamp_millis(),
            command_executed,
            action_result,
        };
        session.messages.push(assistant_message.clone());
        session.last_active = chrono::Utc::now().timestamp_millis();

        assistant_message
    }; // Lock released here

    Ok(assistant_message)
}

/// Get current chat history
#[command]
pub async fn get_chat_history(state: State<'_, AIChatState>) -> Result<Vec<ChatMessage>, String> {
    let current = state.current_session.lock().unwrap();

    if let Some(session) = current.as_ref() {
        Ok(session.messages.clone())
    } else {
        Ok(vec![])
    }
}

/// Clear chat history
#[command]
pub async fn clear_chat_history(state: State<'_, AIChatState>) -> Result<(), String> {
    let mut current = state.current_session.lock().unwrap();

    if let Some(session) = current.as_mut() {
        session.messages.clear();
        session.messages.push(ChatMessage {
            id: uuid::Uuid::new_v4().to_string(),
            role: "system".to_string(),
            content: "Chat reiniciado. ¿En qué puedo ayudarte?".to_string(),
            timestamp: chrono::Utc::now().timestamp_millis(),
            command_executed: None,
            action_result: None,
        });
    }

    Ok(())
}

/// Update browser context (called from frontend)
#[command]
pub async fn update_browser_context(
    context: BrowserContext,
    state: State<'_, AIChatState>,
) -> Result<(), String> {
    let mut current = state.current_session.lock().unwrap();

    if let Some(session) = current.as_mut() {
        session.context = context;
    }

    Ok(())
}

/// Get current browser context
#[command]
pub async fn get_browser_context(state: State<'_, AIChatState>) -> Result<BrowserContext, String> {
    let current = state.current_session.lock().unwrap();

    if let Some(session) = current.as_ref() {
        Ok(session.context.clone())
    } else {
        Ok(BrowserContext {
            current_url: String::new(),
            current_title: String::new(),
            tabs_count: 0,
            active_downloads: 0,
            last_command: None,
        })
    }
}

/// Get command suggestions based on context
#[command]
pub async fn get_command_suggestions(query: String) -> Result<Vec<CommandSuggestion>, String> {
    let query_lower = query.to_lowercase();
    let mut suggestions = vec![];

    // Browser commands
    if query_lower.contains("tab") || query_lower.contains("pestaña") || query.is_empty() {
        suggestions.push(CommandSuggestion {
            command: "new_tab".to_string(),
            description: "Abrir nueva pestaña".to_string(),
            example: "Abre una nueva pestaña".to_string(),
            category: "browser".to_string(),
        });
        suggestions.push(CommandSuggestion {
            command: "close_tab".to_string(),
            description: "Cerrar pestaña actual".to_string(),
            example: "Cierra esta pestaña".to_string(),
            category: "browser".to_string(),
        });
    }

    // Download commands
    if query_lower.contains("descarg") || query_lower.contains("download") || query.is_empty() {
        suggestions.push(CommandSuggestion {
            command: "get_downloads".to_string(),
            description: "Ver descargas activas".to_string(),
            example: "Muéstrame las descargas".to_string(),
            category: "downloads".to_string(),
        });
        suggestions.push(CommandSuggestion {
            command: "pause_all_downloads".to_string(),
            description: "Pausar todas las descargas".to_string(),
            example: "Pausa todas las descargas".to_string(),
            category: "downloads".to_string(),
        });
    }

    // Screenshot commands
    if query_lower.contains("captur")
        || query_lower.contains("screenshot")
        || query_lower.contains("pantalla")
        || query.is_empty()
    {
        suggestions.push(CommandSuggestion {
            command: "capture_screenshot".to_string(),
            description: "Capturar screenshot".to_string(),
            example: "Toma una captura de pantalla".to_string(),
            category: "screen".to_string(),
        });
    }

    // Workflow commands
    if query_lower.contains("workflow")
        || query_lower.contains("automatiz")
        || query_lower.contains("macro")
        || query.is_empty()
    {
        suggestions.push(CommandSuggestion {
            command: "list_workflows".to_string(),
            description: "Listar workflows disponibles".to_string(),
            example: "Muéstrame los workflows".to_string(),
            category: "automation".to_string(),
        });
        suggestions.push(CommandSuggestion {
            command: "execute_workflow".to_string(),
            description: "Ejecutar workflow".to_string(),
            example: "Ejecuta el workflow de login".to_string(),
            category: "automation".to_string(),
        });
    }

    // LendingPad commands
    if query_lower.contains("lending")
        || query_lower.contains("formulario")
        || query_lower.contains("form")
        || query.is_empty()
    {
        suggestions.push(CommandSuggestion {
            command: "analyze_lendingpad_form".to_string(),
            description: "Analizar formulario LendingPad".to_string(),
            example: "Analiza este formulario de LendingPad".to_string(),
            category: "lendingpad".to_string(),
        });
    }

    Ok(suggestions)
}

/// Execute a voice command (text from speech recognition)
#[command]
pub async fn execute_voice_command(
    transcript: String,
    state: State<'_, AIChatState>,
) -> Result<ChatMessage, String> {
    // Use the same logic as send_chat_message
    send_chat_message(transcript, state).await
}

/// Set OpenAI API key
#[command]
pub async fn set_openai_api_key(
    api_key: String,
    state: State<'_, AIChatState>,
) -> Result<(), String> {
    let mut key = state.api_key.lock().unwrap();
    *key = Some(api_key);
    Ok(())
}

/// Get available OpenAI models
#[command]
pub async fn get_available_models() -> Result<Vec<String>, String> {
    Ok(vec![
        "gpt-5.2".to_string(),        // Best model for coding and agentic tasks
        "gpt-5-mini".to_string(),     // Fast, cost-effective - RECOMMENDED for most tasks
        "gpt-5-nano".to_string(),     // Fastest, cheapest model
        "gpt-5-pro".to_string(),      // Most precise and intelligent
        "gpt-4.1".to_string(),        // Best non-reasoning model
        "gpt-5.2-codex".to_string(),  // Optimized for code generation
    ])
}

/// Set selected model
#[command]
pub async fn set_selected_model(
    model: String,
    state: State<'_, AIChatState>,
) -> Result<(), String> {
    let mut selected = state.selected_model.lock().unwrap();
    *selected = model;
    Ok(())
}

/// Get current selected model
#[command]
pub async fn get_selected_model(state: State<'_, AIChatState>) -> Result<String, String> {
    let selected = state.selected_model.lock().unwrap();
    Ok(selected.clone())
}

// ===== INTERNAL HELPERS =====

/// Generate AI response using OpenAI API
async fn generate_ai_response(
    message: &str,
    state: &State<'_, AIChatState>,
) -> (String, Option<String>, Option<ActionResult>) {
    // Get API key and model
    let (api_key_opt, model) = {
        let key = state.api_key.lock().unwrap();
        let model = state.selected_model.lock().unwrap();
        (key.clone(), model.clone())
    };

    // If no API key, use fallback logic
    if api_key_opt.is_none() {
        return parse_and_execute_command_fallback(message).await;
    }

    let api_key = api_key_opt.unwrap();

    // Get conversation history for context
    let messages_history = {
        let current = state.current_session.lock().unwrap();
        if let Some(session) = current.as_ref() {
            session.messages.clone()
        } else {
            vec![]
        }
    };

    // Build OpenAI messages
    let mut openai_messages: Vec<ChatCompletionRequestMessage> = vec![];

    // System message
    let system_message = ChatCompletionRequestSystemMessageArgs::default()
        .content(
            "Eres un asistente AI para CUBE Elite Browser. Ayudas a los usuarios a:\n\
            - Navegar y controlar tabs del navegador\n\
            - Gestionar descargas\n\
            - Ejecutar workflows y automatizaciones\n\
            - Capturar screenshots\n\
            - Automatizar formularios LendingPad\n\
            - Crear y ejecutar macros\n\n\
            Responde de forma concisa, amigable y en español. Si detectas que el usuario quiere \
            ejecutar una acción específica, indícalo claramente.",
        )
        .build()
        .map_err(|e| format!("Error building system message: {}", e))
        .unwrap()
        .into();

    openai_messages.push(system_message);

    // Add conversation history (last 10 messages for context)
    for msg in messages_history.iter().rev().take(10).rev() {
        if msg.role == "user" {
            if let Ok(user_msg) = ChatCompletionRequestUserMessageArgs::default()
                .content(msg.content.clone())
                .build()
            {
                openai_messages.push(user_msg.into());
            }
        } else if msg.role == "assistant" {
            if let Ok(assistant_msg) = ChatCompletionRequestAssistantMessageArgs::default()
                .content(msg.content.clone())
                .build()
            {
                openai_messages.push(assistant_msg.into());
            }
        }
    }

    // Create OpenAI client with API key
    let config = async_openai::config::OpenAIConfig::new().with_api_key(&api_key);
    let client = Client::with_config(config);

    // Make API request
    let request = CreateChatCompletionRequestArgs::default()
        .model(&model)
        .messages(openai_messages)
        .temperature(0.7)
        .max_tokens(500u32)
        .build();

    match request {
        Ok(req) => {
            match client.chat().create(req).await {
                Ok(response) => {
                    if let Some(choice) = response.choices.first() {
                        if let Some(content) = &choice.message.content {
                            // Analyze response for commands
                            let (command, action_result) =
                                extract_command_from_response(content, message);
                            return (content.to_string(), command, action_result);
                        }
                    }
                    // Fallback if no content
                    parse_and_execute_command_fallback(message).await
                }
                Err(e) => {
                    log::error!("OpenAI API error: {:?}", e);
                    // Fallback on error
                    parse_and_execute_command_fallback(message).await
                }
            }
        }
        Err(e) => {
            log::error!("Error building OpenAI request: {:?}", e);
            parse_and_execute_command_fallback(message).await
        }
    }
}

/// Extract command intent from AI response
fn extract_command_from_response(
    response: &str,
    user_message: &str,
) -> (Option<String>, Option<ActionResult>) {
    let _response_lower = response.to_lowercase();
    let message_lower = user_message.to_lowercase();

    // Detect if a command should be executed based on keywords
    if message_lower.contains("nueva pestaña") || message_lower.contains("new tab") {
        return (
            Some("new_tab".to_string()),
            Some(ActionResult {
                success: true,
                message: "Nueva pestaña abierta".to_string(),
                data: None,
            }),
        );
    }

    if message_lower.contains("cerrar pestaña") || message_lower.contains("close tab") {
        return (
            Some("close_tab".to_string()),
            Some(ActionResult {
                success: true,
                message: "Pestaña cerrada".to_string(),
                data: None,
            }),
        );
    }

    if message_lower.contains("captura") || message_lower.contains("screenshot") {
        return (
            Some("capture_screenshot".to_string()),
            Some(ActionResult {
                success: true,
                message: "Screenshot capturado".to_string(),
                data: None,
            }),
        );
    }

    (None, None)
}

/// Fallback command parsing when OpenAI is not available
async fn parse_and_execute_command_fallback(
    message: &str,
) -> (String, Option<String>, Option<ActionResult>) {
    let message_lower = message.to_lowercase();

    // Tab commands
    if message_lower.contains("nueva pestaña") || message_lower.contains("new tab") {
        return (
            "✅ Abriendo nueva pestaña...".to_string(),
            Some("new_tab".to_string()),
            Some(ActionResult {
                success: true,
                message: "Nueva pestaña abierta".to_string(),
                data: None,
            }),
        );
    }

    if message_lower.contains("cerrar pestaña") || message_lower.contains("close tab") {
        return (
            "✅ Cerrando pestaña actual...".to_string(),
            Some("close_tab".to_string()),
            Some(ActionResult {
                success: true,
                message: "Pestaña cerrada".to_string(),
                data: None,
            }),
        );
    }

    // Download commands
    if message_lower.contains("descargas") || message_lower.contains("downloads") {
        return (
            "📥 Aquí están tus descargas activas. ¿Quieres pausar alguna?".to_string(),
            Some("get_downloads".to_string()),
            Some(ActionResult {
                success: true,
                message: "Lista de descargas obtenida".to_string(),
                data: None,
            }),
        );
    }

    if message_lower.contains("pausar descargas") || message_lower.contains("pause downloads") {
        return (
            "⏸️ Pausando todas las descargas...".to_string(),
            Some("pause_all_downloads".to_string()),
            Some(ActionResult {
                success: true,
                message: "Descargas pausadas".to_string(),
                data: None,
            }),
        );
    }

    // Screenshot commands
    if message_lower.contains("captura")
        || message_lower.contains("screenshot")
        || message_lower.contains("pantalla")
    {
        return (
            "📸 Capturando screenshot...".to_string(),
            Some("capture_screenshot".to_string()),
            Some(ActionResult {
                success: true,
                message: "Screenshot capturado".to_string(),
                data: None,
            }),
        );
    }

    // Workflow commands
    if message_lower.contains("workflows") || message_lower.contains("automatiz") {
        return (
            "🤖 Aquí están tus workflows disponibles:\n\n\
            1. Login Automation\n\
            2. Form Fill Assistant\n\
            3. Data Extraction\n\n\
            ¿Cuál quieres ejecutar?"
                .to_string(),
            Some("list_workflows".to_string()),
            Some(ActionResult {
                success: true,
                message: "Lista de workflows obtenida".to_string(),
                data: None,
            }),
        );
    }

    // Help/default response
    if message_lower.contains("ayuda")
        || message_lower.contains("help")
        || message_lower.contains("qué puedes hacer")
    {
        return (
            "💡 Puedo ayudarte con:\n\n\
            🌐 **Navegación:**\n\
            • Abrir/cerrar tabs\n\
            • Navegar a URLs\n\
            • Bookmarks\n\n\
            📥 **Descargas:**\n\
            • Ver descargas activas\n\
            • Pausar/reanudar\n\
            • Gestionar archivos\n\n\
            🤖 **Automatización:**\n\
            • Ejecutar workflows\n\
            • Crear macros\n\
            • Automatizar formularios\n\n\
            📸 **Capturas:**\n\
            • Screenshots\n\
            • Grabación de pantalla\n\n\
            Simplemente dime qué quieres hacer y lo haré por ti."
                .to_string(),
            None,
            None,
        );
    }

    // Default intelligent response
    (
        format!(
            "🤔 Entiendo que quieres: \"{}\"\n\n\
            Para ayudarte mejor, podrías ser más específico? Por ejemplo:\n\
            • \"Abre una nueva pestaña\"\n\
            • \"Muéstrame las descargas\"\n\
            • \"Ejecuta el workflow de login\"\n\
            • \"Captura una screenshot\"\n\n\
            También puedes decir \"ayuda\" para ver todas las opciones.",
            message
        ),
        None,
        None,
    )
}
