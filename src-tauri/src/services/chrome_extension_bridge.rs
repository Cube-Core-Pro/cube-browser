use log::{debug, warn};
use serde_json::{json, Map, Value};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

const MAX_HISTORY: usize = 128;

/// Runtime + storage bridge that mimics the Chrome extension APIs inside CUBE's WebView windows.
pub struct ChromeExtensionBridgeState {
    app_handle: AppHandle,
    storage: Arc<Mutex<HashMap<String, Value>>>,
    runtime_history: Arc<Mutex<VecDeque<Value>>>,
}

impl ChromeExtensionBridgeState {
    pub fn new(app_handle: &AppHandle) -> Result<Self, String> {
        Ok(Self {
            app_handle: app_handle.clone(),
            storage: Arc::new(Mutex::new(HashMap::new())),
            runtime_history: Arc::new(Mutex::new(VecDeque::with_capacity(MAX_HISTORY))),
        })
    }

    /// Send a runtime message to all attached browser windows and keep a short history for debugging.
    pub fn runtime_send_message(&self, message: Value) -> Result<Value, String> {
        self.append_history(&message);
        self.dispatch_dom_event("cube-extension-runtime-message", &message)?;

        let response = json!({
            "success": true,
            "delivered": true,
            "echo": message,
        });

        Ok(response)
    }

    /// Mimics chrome.storage.local.get semantics.
    pub fn storage_get(&self, query: Option<Value>) -> Result<Value, String> {
        let store = self
            .storage
            .lock()
            .map_err(|err| format!("Failed to acquire storage lock: {err}"))?;

        let mut result = Map::new();
        match query {
            None | Some(Value::Null) => {
                for (key, value) in store.iter() {
                    result.insert(key.clone(), value.clone());
                }
            }
            Some(Value::String(key)) => {
                if let Some(value) = store.get(&key) {
                    result.insert(key, value.clone());
                }
            }
            Some(Value::Array(keys)) => {
                for key_value in keys {
                    if let Some(key) = key_value.as_str() {
                        if let Some(value) = store.get(key) {
                            result.insert(key.to_string(), value.clone());
                        }
                    }
                }
            }
            Some(Value::Object(template)) => {
                for (key, default_value) in template {
                    let resolved = store.get(&key).cloned().unwrap_or(default_value);
                    result.insert(key, resolved);
                }
            }
            Some(other) => {
                return Err(format!(
                    "Unsupported query for chrome.storage.get: expected string/array/object, got {other:?}"
                ));
            }
        }

        Ok(Value::Object(result))
    }

    /// Mimics chrome.storage.local.set semantics.
    pub fn storage_set(&self, items: Value) -> Result<Value, String> {
        let items_map = items
            .as_object()
            .ok_or_else(|| "chrome.storage.set expects an object".to_string())?;

        let mut store = self
            .storage
            .lock()
            .map_err(|err| format!("Failed to acquire storage lock: {err}"))?;

        for (key, value) in items_map {
            store.insert(key.clone(), value.clone());
        }

        Ok(json!({
            "success": true,
            "keys": items_map.keys().cloned().collect::<Vec<String>>(),
        }))
    }

    /// Clears the in-memory storage namespace.
    pub fn storage_clear(&self) -> Result<Value, String> {
        let mut store = self
            .storage
            .lock()
            .map_err(|err| format!("Failed to acquire storage lock: {err}"))?;
        store.clear();

        Ok(json!({ "success": true }))
    }

    fn append_history(&self, payload: &Value) {
        if let Ok(mut history) = self.runtime_history.lock() {
            if history.len() >= MAX_HISTORY {
                history.pop_front();
            }
            history.push_back(payload.clone());
        }
    }

    fn dispatch_dom_event(&self, event_name: &str, payload: &Value) -> Result<(), String> {
        let serialized = serde_json::to_string(payload)
            .map_err(|err| format!("Failed to serialize runtime payload: {err}"))?;

        for (label, window) in self.app_handle.webview_windows() {
            let script = format!(
                "window.dispatchEvent(new CustomEvent('{event}', {{ detail: {payload} }}));",
                event = event_name,
                payload = serialized
            );

            if let Err(err) = window.eval(script.as_str()) {
                warn!(
                    "Failed to dispatch chrome extension runtime message to window {label}: {err}"
                );
            } else {
                debug!("Dispatched chrome extension runtime message to window {label}");
            }
        }

        Ok(())
    }
}
