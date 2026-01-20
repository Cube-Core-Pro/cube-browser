// DevTools Service - Browser Developer Tools Integration
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsoleMessage {
    #[serde(rename = "type")]
    pub msg_type: String,
    pub message: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkRequest {
    pub url: String,
    pub method: String,
    pub status: i32,
    pub duration: i32,
    pub size: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomElement {
    pub tag: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    pub children: Vec<DomElement>,
}

pub struct DevToolsService {
    console_messages: Arc<Mutex<HashMap<String, Vec<ConsoleMessage>>>>,
    network_requests: Arc<Mutex<HashMap<String, Vec<NetworkRequest>>>>,
}

impl DevToolsService {
    pub fn new() -> Self {
        Self {
            console_messages: Arc::new(Mutex::new(HashMap::new())),
            network_requests: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn get_console_messages(&self, tab_id: &str) -> Result<Vec<ConsoleMessage>> {
        let messages = self.console_messages.lock().unwrap();
        Ok(messages.get(tab_id).cloned().unwrap_or_default())
    }

    pub fn add_console_message(&self, tab_id: &str, msg_type: &str, message: &str) -> Result<()> {
        let mut messages = self.console_messages.lock().unwrap();
        let tab_messages = messages.entry(tab_id.to_string()).or_default();

        tab_messages.push(ConsoleMessage {
            msg_type: msg_type.to_string(),
            message: message.to_string(),
            timestamp: chrono::Utc::now().timestamp_millis(),
        });

        // Keep only last 1000 messages
        if tab_messages.len() > 1000 {
            tab_messages.drain(0..(tab_messages.len() - 1000));
        }

        Ok(())
    }

    pub fn get_network_requests(&self, tab_id: &str) -> Result<Vec<NetworkRequest>> {
        let requests = self.network_requests.lock().unwrap();
        Ok(requests.get(tab_id).cloned().unwrap_or_default())
    }

    pub fn add_network_request(&self, tab_id: &str, request: NetworkRequest) -> Result<()> {
        let mut requests = self.network_requests.lock().unwrap();
        let tab_requests = requests.entry(tab_id.to_string()).or_default();

        tab_requests.push(request);

        // Keep only last 500 requests
        if tab_requests.len() > 500 {
            tab_requests.drain(0..(tab_requests.len() - 500));
        }

        Ok(())
    }

    pub fn get_dom_tree(&self, _tab_id: &str) -> Result<DomElement> {
        // Mock implementation - would need browser integration
        Ok(DomElement {
            tag: "html".to_string(),
            id: None,
            class: None,
            text: None,
            children: vec![
                DomElement {
                    tag: "head".to_string(),
                    id: None,
                    class: None,
                    text: None,
                    children: vec![],
                },
                DomElement {
                    tag: "body".to_string(),
                    id: None,
                    class: None,
                    text: None,
                    children: vec![],
                },
            ],
        })
    }

    pub fn get_local_storage(&self, _tab_id: &str) -> Result<HashMap<String, String>> {
        // Mock implementation - would need browser integration
        Ok(HashMap::new())
    }

    pub fn get_session_storage(&self, _tab_id: &str) -> Result<HashMap<String, String>> {
        // Mock implementation - would need browser integration
        Ok(HashMap::new())
    }

    pub fn execute_script(&self, tab_id: &str, script: &str) -> Result<serde_json::Value> {
        // Log the script execution attempt
        self.add_console_message(tab_id, "log", &format!("> {}", script))?;

        // Parse and evaluate simple JavaScript expressions
        // This is a mock implementation for development/testing
        // Real implementation would use CDP Runtime.evaluate
        let result = evaluate_mock_script(script);
        
        // Log the result
        self.add_console_message(tab_id, "log", &format!("< {}", result))?;
        
        Ok(serde_json::json!({
            "result": result,
            "type": "mock",
            "note": "Script execution simulated - connect to real browser for live evaluation"
        }))
    }

    pub fn clear_console(&self, tab_id: &str) -> Result<()> {
        let mut messages = self.console_messages.lock().unwrap();
        messages.remove(tab_id);
        Ok(())
    }

    pub fn clear_network(&self, tab_id: &str) -> Result<()> {
        let mut requests = self.network_requests.lock().unwrap();
        requests.remove(tab_id);
        Ok(())
    }
}

impl Default for DevToolsService {
    fn default() -> Self {
        Self::new()
    }
}

/// Mock script evaluator for development/testing
/// Handles simple JavaScript expressions without a real browser
fn evaluate_mock_script(script: &str) -> String {
    let trimmed = script.trim();
    
    // Handle common patterns
    if trimmed.starts_with("console.log") {
        // Extract the argument from console.log(...)
        if let Some(start) = trimmed.find('(') {
            if let Some(end) = trimmed.rfind(')') {
                let arg = &trimmed[start + 1..end];
                return format!("undefined (logged: {})", arg.trim_matches(|c| c == '"' || c == '\''));
            }
        }
        return "undefined".to_string();
    }
    
    // Simple arithmetic evaluation
    if trimmed.chars().all(|c| c.is_ascii_digit() || c == '+' || c == '-' || c == '*' || c == '/' || c == ' ' || c == '(' || c == ')' || c == '.') {
        if let Some(result) = simple_math_eval(trimmed) {
            return result.to_string();
        }
    }
    
    // String literals
    if (trimmed.starts_with('"') && trimmed.ends_with('"')) || 
       (trimmed.starts_with('\'') && trimmed.ends_with('\'')) {
        return trimmed[1..trimmed.len()-1].to_string();
    }
    
    // Common JavaScript expressions
    match trimmed {
        "null" => "null".to_string(),
        "undefined" => "undefined".to_string(),
        "true" => "true".to_string(),
        "false" => "false".to_string(),
        "NaN" => "NaN".to_string(),
        "Infinity" => "Infinity".to_string(),
        "window" => "[object Window]".to_string(),
        "document" => "[object HTMLDocument]".to_string(),
        "navigator.userAgent" => "Mozilla/5.0 (Macintosh; CUBE DevTools)".to_string(),
        "location.href" => "about:blank".to_string(),
        "Date.now()" => chrono::Utc::now().timestamp_millis().to_string(),
        "Math.PI" => std::f64::consts::PI.to_string(),
        "Math.E" => std::f64::consts::E.to_string(),
        "Math.random()" => format!("{:.16}", rand::random::<f64>()),
        _ => {
            // Try to detect array/object literals
            if trimmed.starts_with('[') && trimmed.ends_with(']') {
                return trimmed.to_string();
            }
            if trimmed.starts_with('{') && trimmed.ends_with('}') {
                return trimmed.to_string();
            }
            // Default: return as-is (simulating undefined behavior)
            format!("undefined // Unrecognized: {}", if trimmed.len() > 50 { &trimmed[..50] } else { trimmed })
        }
    }
}

/// Simple math expression evaluator
fn simple_math_eval(expr: &str) -> Option<f64> {
    let expr = expr.replace(' ', "");
    
    // Handle single numbers
    if let Ok(n) = expr.parse::<f64>() {
        return Some(n);
    }
    
    // Simple operations (no parentheses handling for safety)
    // Try to find operators from right to left for correct precedence
    for (i, op) in ['+', '-'].iter().enumerate() {
        if let Some(pos) = expr.rfind(*op) {
            if pos > 0 {
                let left = simple_math_eval(&expr[..pos])?;
                let right = simple_math_eval(&expr[pos + 1..])?;
                return Some(if i == 0 { left + right } else { left - right });
            }
        }
    }
    
    for (i, op) in ['*', '/'].iter().enumerate() {
        if let Some(pos) = expr.rfind(*op) {
            if pos > 0 {
                let left = simple_math_eval(&expr[..pos])?;
                let right = simple_math_eval(&expr[pos + 1..])?;
                return Some(if i == 0 { left * right } else { left / right });
            }
        }
    }
    
    None
}
