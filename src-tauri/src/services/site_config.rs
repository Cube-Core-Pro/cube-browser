// CUBE Nexum - Site Configuration Service (Backend)
// 
// Manages centralized site configuration with persistence,
// versioning, and audit trail.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use uuid::Uuid;

// =============================================================================
// TYPES
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhoneNumbers {
    pub support: String,
    pub sales: String,
    pub main: Option<String>,
    pub emergency: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAddresses {
    pub info: String,
    pub support: String,
    pub careers: String,
    pub investors: String,
    pub press: Option<String>,
    pub legal: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhysicalAddress {
    pub street: String,
    pub city: String,
    pub state: String,
    pub country: String,
    pub postal_code: String,
    pub lat: Option<f64>,
    pub lng: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactInfo {
    pub phones: PhoneNumbers,
    pub emails: EmailAddresses,
    pub address: PhysicalAddress,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialMediaLinks {
    pub linkedin: Option<String>,
    pub twitter: Option<String>,
    pub instagram: Option<String>,
    pub youtube: Option<String>,
    pub facebook: Option<String>,
    pub tiktok: Option<String>,
    pub discord: Option<String>,
    pub github: Option<String>,
    pub medium: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegulatoryLicense {
    pub name: String,
    pub number: String,
    pub authority: String,
    pub valid_until: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegalInfo {
    pub company_name: String,
    pub trade_name: Option<String>,
    pub registration_country: String,
    pub tax_id: String,
    pub registration_number: Option<String>,
    pub vat_number: Option<String>,
    pub incorporation_date: Option<String>,
    pub legal_address: Option<String>,
    pub regulatory_licenses: Option<Vec<RegulatoryLicense>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrandingColors {
    pub primary: String,
    pub secondary: String,
    pub accent: String,
    pub background: String,
    pub text: String,
    pub error: String,
    pub success: String,
    pub warning: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrandingLogo {
    pub main: String,
    pub favicon: String,
    pub dark_mode: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrandingConfig {
    pub colors: BrandingColors,
    pub logo: BrandingLogo,
    pub tagline: String,
    pub slogan: Option<String>,
    pub mission: Option<String>,
    pub vision: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExpectedReturn {
    pub min: f64,
    pub max: f64,
    pub average: f64,
    pub period: String, // monthly, quarterly, yearly
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MinimumInvestment {
    pub amount: f64,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestmentType {
    pub id: String,
    pub name: String,
    pub description: String,
    pub min_amount: f64,
    pub max_amount: Option<f64>,
    pub expected_return: f64,
    pub lock_period: Option<u32>, // days
    pub risk_level: String, // low, medium, high
    pub features: Vec<String>,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Token {
    pub id: String,
    pub symbol: String,
    pub name: String,
    pub description: String,
    pub price: f64,
    pub total_supply: u64,
    pub available_supply: u64,
    pub blockchain: Option<String>,
    pub contract_address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestorConfig {
    pub expected_return: ExpectedReturn,
    pub minimum_investment: MinimumInvestment,
    pub investment_types: Vec<InvestmentType>,
    pub tokens: Option<Vec<Token>>,
    pub disclaimers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Salary {
    pub min: f64,
    pub max: f64,
    pub currency: String,
    pub period: String, // hourly, monthly, yearly
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobPosition {
    pub id: String,
    pub title: String,
    pub department: String,
    pub location: String,
    pub job_type: String, // full-time, part-time, contract, internship, remote
    pub experience: String,
    pub description: String,
    pub requirements: Vec<String>,
    pub responsibilities: Vec<String>,
    pub salary: Option<Salary>,
    pub benefits: Option<Vec<String>>,
    pub tech_stack: Option<Vec<String>>,
    pub posted_date: String,
    pub closing_date: Option<String>,
    pub active: bool,
    pub featured: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Benefit {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: Option<String>,
    pub category: String, // health, financial, lifestyle, professional, other
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechCategory {
    pub category: String,
    pub technologies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CareersConfig {
    pub open_positions: Vec<JobPosition>,
    pub benefits: Vec<Benefit>,
    pub tech_stack: Vec<TechCategory>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureFlags {
    pub investor_portal_enabled: bool,
    pub careers_page_enabled: bool,
    pub chat_support_enabled: bool,
    pub phone_support_24x7: bool,
    pub whatsapp_enabled: bool,
    pub ai_assistant_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteConfiguration {
    pub id: String,
    pub version: String,
    pub last_updated: String,
    pub updated_by: String,
    
    pub contact: ContactInfo,
    pub social: SocialMediaLinks,
    pub legal: LegalInfo,
    pub branding: BrandingConfig,
    pub investors: InvestorConfig,
    pub careers: CareersConfig,
    pub features: Option<FeatureFlags>,
    pub custom_fields: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigVersion {
    pub version: String,
    pub timestamp: String,
    pub updated_by: String,
    pub config: SiteConfiguration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigUpdateResult {
    pub success: bool,
    pub version: String,
    pub timestamp: String,
    pub error: Option<String>,
}

// =============================================================================
// STATE
// =============================================================================

pub struct SiteConfigState {
    current: RwLock<Option<SiteConfiguration>>,
    history: RwLock<Vec<ConfigVersion>>,
}

impl Default for SiteConfigState {
    fn default() -> Self {
        Self::new()
    }
}

impl SiteConfigState {
    pub fn new() -> Self {
        Self {
            current: RwLock::new(None),
            history: RwLock::new(Vec::new()),
        }
    }
    
    pub fn get_current(&self) -> Option<SiteConfiguration> {
        self.current.read().ok().and_then(|c| c.clone())
    }
    
    pub fn set_current(&self, config: SiteConfiguration) -> ConfigUpdateResult {
        // Save to history
        if let Some(current) = self.get_current() {
            if let Ok(mut history) = self.history.write() {
                history.push(ConfigVersion {
                    version: current.version.clone(),
                    timestamp: current.last_updated.clone(),
                    updated_by: current.updated_by.clone(),
                    config: current,
                });
                
                // Keep only last 50 versions
                if history.len() > 50 {
                    history.remove(0);
                }
            }
        }
        
        let version = config.version.clone();
        let timestamp = config.last_updated.clone();
        
        match self.current.write() {
            Ok(mut current) => {
                *current = Some(config);
                ConfigUpdateResult {
                    success: true,
                    version,
                    timestamp,
                    error: None,
                }
            }
            Err(e) => ConfigUpdateResult {
                success: false,
                version,
                timestamp,
                error: Some(format!("Failed to update config: {}", e)),
            }
        }
    }
    
    pub fn get_history(&self) -> Vec<ConfigVersion> {
        self.history.read().ok()
            .map(|h| h.clone())
            .unwrap_or_default()
    }
    
    pub fn rollback(&self, version: &str) -> Option<SiteConfiguration> {
        if let Ok(history) = self.history.read() {
            history.iter()
                .find(|v| v.version == version)
                .map(|v| v.config.clone())
        } else {
            None
        }
    }
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

impl Default for SiteConfiguration {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            version: "1.0.0".to_string(),
            last_updated: Utc::now().to_rfc3339(),
            updated_by: "system".to_string(),
            
            contact: ContactInfo {
                phones: PhoneNumbers {
                    support: "+1 (555) 123-4567".to_string(),
                    sales: "+1 (555) 123-4568".to_string(),
                    main: Some("+1 (555) 123-4500".to_string()),
                    emergency: None,
                },
                emails: EmailAddresses {
                    info: "info@cube-nexum.com".to_string(),
                    support: "support@cube-nexum.com".to_string(),
                    careers: "careers@cube-nexum.com".to_string(),
                    investors: "investors@cube-nexum.com".to_string(),
                    press: None,
                    legal: None,
                },
                address: PhysicalAddress {
                    street: "123 Innovation Drive".to_string(),
                    city: "San Francisco".to_string(),
                    state: "CA".to_string(),
                    country: "USA".to_string(),
                    postal_code: "94105".to_string(),
                    lat: None,
                    lng: None,
                },
            },
            
            social: SocialMediaLinks {
                linkedin: Some("https://linkedin.com/company/cube-nexum".to_string()),
                twitter: Some("https://twitter.com/cube_nexum".to_string()),
                instagram: Some("https://instagram.com/cube_nexum".to_string()),
                youtube: Some("https://youtube.com/@cube-nexum".to_string()),
                facebook: None,
                tiktok: None,
                discord: None,
                github: Some("https://github.com/cube-nexum".to_string()),
                medium: None,
            },
            
            legal: LegalInfo {
                company_name: "CUBE Nexum Technologies Inc.".to_string(),
                trade_name: None,
                registration_country: "USA".to_string(),
                tax_id: "XX-XXXXXXX".to_string(),
                registration_number: None,
                vat_number: None,
                incorporation_date: None,
                legal_address: None,
                regulatory_licenses: None,
            },
            
            branding: BrandingConfig {
                colors: BrandingColors {
                    primary: "#6366f1".to_string(),
                    secondary: "#8b5cf6".to_string(),
                    accent: "#06b6d4".to_string(),
                    background: "#0f172a".to_string(),
                    text: "#f8fafc".to_string(),
                    error: "#ef4444".to_string(),
                    success: "#22c55e".to_string(),
                    warning: "#f59e0b".to_string(),
                },
                logo: BrandingLogo {
                    main: "/images/logo.svg".to_string(),
                    favicon: "/favicon.ico".to_string(),
                    dark_mode: None,
                    icon: None,
                },
                tagline: "The Future of Business Automation".to_string(),
                slogan: None,
                mission: None,
                vision: None,
            },
            
            investors: InvestorConfig {
                expected_return: ExpectedReturn {
                    min: 8.0,
                    max: 25.0,
                    average: 15.0,
                    period: "yearly".to_string(),
                },
                minimum_investment: MinimumInvestment {
                    amount: 1000.0,
                    currency: "USD".to_string(),
                },
                investment_types: vec![],
                tokens: None,
                disclaimers: vec![
                    "Past performance does not guarantee future results.".to_string(),
                    "All investments carry risk of loss.".to_string(),
                ],
            },
            
            careers: CareersConfig {
                open_positions: vec![],
                benefits: vec![],
                tech_stack: vec![],
            },
            
            features: Some(FeatureFlags {
                investor_portal_enabled: true,
                careers_page_enabled: true,
                chat_support_enabled: true,
                phone_support_24x7: false,
                whatsapp_enabled: true,
                ai_assistant_enabled: true,
            }),
            
            custom_fields: None,
        }
    }
}
