use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppError {
    pub message: String,
    pub code: Option<String>,
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for AppError {}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError {
            message: err.to_string(),
            code: None,
        }
    }
}

impl From<String> for AppError {
    fn from(message: String) -> Self {
        AppError {
            message,
            code: None,
        }
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
