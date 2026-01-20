// CUBE Nexum - Password Generator Service
// Secure password generation with customizable rules

use std::collections::HashMap;
use std::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use rand::Rng;

// ==================== Types ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordGeneratorSettings {
    pub enabled: bool,
    pub default_length: u32,
    pub default_options: PasswordOptions,
    pub show_strength_indicator: bool,
    pub auto_copy_to_clipboard: bool,
    pub show_in_context_menu: bool,
    pub remember_last_options: bool,
    pub keyboard_shortcut: String,
    pub custom_character_sets: Vec<CustomCharacterSet>,
    pub pronounceable_settings: PronounceableSettings,
    pub passphrase_settings: PassphraseSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordOptions {
    pub length: u32,
    pub include_uppercase: bool,
    pub include_lowercase: bool,
    pub include_numbers: bool,
    pub include_symbols: bool,
    pub symbols: String,
    pub exclude_ambiguous: bool,
    pub exclude_similar: bool,
    pub custom_exclusions: String,
    pub require_each_type: bool,
    pub no_repeating: bool,
    pub no_sequential: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomCharacterSet {
    pub id: String,
    pub name: String,
    pub characters: String,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PronounceableSettings {
    pub syllable_count: u32,
    pub capitalize_first: bool,
    pub add_number: bool,
    pub add_symbol: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PassphraseSettings {
    pub word_count: u32,
    pub separator: String,
    pub capitalize: CapitalizeOption,
    pub add_number: bool,
    pub number_position: NumberPosition,
    pub word_list: WordListOption,
    pub min_word_length: u32,
    pub max_word_length: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CapitalizeOption {
    None,
    First,
    All,
    Random,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NumberPosition {
    Start,
    End,
    Random,
    BetweenWords,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum WordListOption {
    Common,
    English,
    EffLarge,
    EffShort,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedPassword {
    pub id: String,
    pub password: String,
    pub strength: PasswordStrength,
    pub entropy_bits: f64,
    pub generation_type: GenerationType,
    pub options_used: GenerationOptions,
    pub domain: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PasswordStrength {
    VeryWeak,
    Weak,
    Fair,
    Strong,
    VeryStrong,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GenerationType {
    Random,
    Pronounceable,
    Passphrase,
    Pin,
    Pattern,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GenerationOptions {
    Random(PasswordOptions),
    Pronounceable(PronounceableSettings),
    Passphrase(PassphraseSettings),
    Pin(u32),
    Pattern(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordAnalysis {
    pub strength: PasswordStrength,
    pub score: u32,
    pub entropy_bits: f64,
    pub crack_time: CrackTime,
    pub issues: Vec<PasswordIssue>,
    pub suggestions: Vec<String>,
    pub character_composition: CharacterComposition,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrackTime {
    pub online_throttled: String,
    pub online_unthrottled: String,
    pub offline_slow: String,
    pub offline_fast: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordIssue {
    pub severity: IssueSeverity,
    pub issue_type: IssueType,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum IssueSeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum IssueType {
    TooShort,
    NoUppercase,
    NoLowercase,
    NoNumbers,
    NoSymbols,
    CommonPattern,
    DictionaryWord,
    RepeatingChars,
    SequentialChars,
    PersonalInfo,
    CommonPassword,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterComposition {
    pub length: u32,
    pub uppercase_count: u32,
    pub lowercase_count: u32,
    pub number_count: u32,
    pub symbol_count: u32,
    pub unique_chars: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordHistory {
    pub id: String,
    pub password_preview: String,
    pub full_password: Option<String>,
    pub strength: PasswordStrength,
    pub generation_type: GenerationType,
    pub domain: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasswordTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub generation_type: GenerationType,
    pub options: GenerationOptions,
    pub is_favorite: bool,
    pub use_count: u32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratorStats {
    pub total_generated: u64,
    pub by_type: HashMap<String, u32>,
    pub by_strength: HashMap<String, u32>,
    pub average_length: f32,
    pub average_entropy: f32,
    pub most_used_templates: Vec<(String, u32)>,
}

// ==================== Service Implementation ====================

pub struct BrowserPasswordGeneratorService {
    settings: RwLock<PasswordGeneratorSettings>,
    history: RwLock<Vec<PasswordHistory>>,
    templates: RwLock<HashMap<String, PasswordTemplate>>,
    word_list: Vec<String>,
}

impl BrowserPasswordGeneratorService {
    pub fn new() -> Self {
        Self {
            settings: RwLock::new(Self::default_settings()),
            history: RwLock::new(Vec::new()),
            templates: RwLock::new(Self::default_templates()),
            word_list: Self::default_word_list(),
        }
    }

    fn default_settings() -> PasswordGeneratorSettings {
        PasswordGeneratorSettings {
            enabled: true,
            default_length: 16,
            default_options: PasswordOptions {
                length: 16,
                include_uppercase: true,
                include_lowercase: true,
                include_numbers: true,
                include_symbols: true,
                symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?".to_string(),
                exclude_ambiguous: true,
                exclude_similar: false,
                custom_exclusions: String::new(),
                require_each_type: true,
                no_repeating: false,
                no_sequential: false,
            },
            show_strength_indicator: true,
            auto_copy_to_clipboard: true,
            show_in_context_menu: true,
            remember_last_options: true,
            keyboard_shortcut: "Ctrl+Shift+G".to_string(),
            custom_character_sets: Vec::new(),
            pronounceable_settings: PronounceableSettings {
                syllable_count: 4,
                capitalize_first: true,
                add_number: true,
                add_symbol: true,
            },
            passphrase_settings: PassphraseSettings {
                word_count: 4,
                separator: "-".to_string(),
                capitalize: CapitalizeOption::First,
                add_number: true,
                number_position: NumberPosition::End,
                word_list: WordListOption::Common,
                min_word_length: 4,
                max_word_length: 8,
            },
        }
    }

    fn default_templates() -> HashMap<String, PasswordTemplate> {
        let mut templates = HashMap::new();

        templates.insert("strong_random".to_string(), PasswordTemplate {
            id: "strong_random".to_string(),
            name: "Strong Random".to_string(),
            description: "20-character password with all character types".to_string(),
            generation_type: GenerationType::Random,
            options: GenerationOptions::Random(PasswordOptions {
                length: 20,
                include_uppercase: true,
                include_lowercase: true,
                include_numbers: true,
                include_symbols: true,
                symbols: "!@#$%^&*".to_string(),
                exclude_ambiguous: true,
                exclude_similar: false,
                custom_exclusions: String::new(),
                require_each_type: true,
                no_repeating: false,
                no_sequential: false,
            }),
            is_favorite: true,
            use_count: 0,
            created_at: Utc::now(),
        });

        templates.insert("memorable".to_string(), PasswordTemplate {
            id: "memorable".to_string(),
            name: "Memorable Passphrase".to_string(),
            description: "4-word passphrase easy to remember".to_string(),
            generation_type: GenerationType::Passphrase,
            options: GenerationOptions::Passphrase(PassphraseSettings {
                word_count: 4,
                separator: "-".to_string(),
                capitalize: CapitalizeOption::First,
                add_number: true,
                number_position: NumberPosition::End,
                word_list: WordListOption::Common,
                min_word_length: 4,
                max_word_length: 8,
            }),
            is_favorite: true,
            use_count: 0,
            created_at: Utc::now(),
        });

        templates.insert("pin_6".to_string(), PasswordTemplate {
            id: "pin_6".to_string(),
            name: "6-Digit PIN".to_string(),
            description: "Numeric PIN code".to_string(),
            generation_type: GenerationType::Pin,
            options: GenerationOptions::Pin(6),
            is_favorite: false,
            use_count: 0,
            created_at: Utc::now(),
        });

        templates.insert("alphanumeric".to_string(), PasswordTemplate {
            id: "alphanumeric".to_string(),
            name: "Alphanumeric Only".to_string(),
            description: "Letters and numbers, no symbols".to_string(),
            generation_type: GenerationType::Random,
            options: GenerationOptions::Random(PasswordOptions {
                length: 16,
                include_uppercase: true,
                include_lowercase: true,
                include_numbers: true,
                include_symbols: false,
                symbols: String::new(),
                exclude_ambiguous: true,
                exclude_similar: false,
                custom_exclusions: String::new(),
                require_each_type: true,
                no_repeating: false,
                no_sequential: false,
            }),
            is_favorite: false,
            use_count: 0,
            created_at: Utc::now(),
        });

        templates
    }

    fn default_word_list() -> Vec<String> {
        vec![
            "apple", "banana", "cherry", "dragon", "eagle", "falcon", "galaxy", "harbor",
            "island", "jungle", "koala", "lemon", "mountain", "nebula", "ocean", "phoenix",
            "quantum", "river", "sunset", "thunder", "unicorn", "valley", "whisper", "xylophone",
            "yellow", "zenith", "anchor", "beacon", "castle", "diamond", "ember", "forest",
            "garden", "horizon", "ivory", "jasmine", "keystone", "lagoon", "marble", "nectar",
            "olive", "prism", "quartz", "rainbow", "silver", "tornado", "umbrella", "violet",
            "willow", "crystal", "breeze", "comet", "dawn", "echo", "flame", "glimmer",
            "haven", "iris", "jewel", "karma", "lunar", "mystic", "nova", "orchid",
            "pearl", "quest", "raven", "storm", "tiger", "unity", "vortex", "wonder",
        ].into_iter().map(String::from).collect()
    }

    // ==================== Settings ====================

    pub fn get_settings(&self) -> PasswordGeneratorSettings {
        self.settings.read().unwrap().clone()
    }

    pub fn update_settings(&self, new_settings: PasswordGeneratorSettings) {
        let mut settings = self.settings.write().unwrap();
        *settings = new_settings;
    }

    // ==================== Password Generation ====================

    pub fn generate(&self, options: GenerationOptions, domain: Option<String>) -> GeneratedPassword {
        let (password, generation_type) = match &options {
            GenerationOptions::Random(opts) => (self.generate_random(opts), GenerationType::Random),
            GenerationOptions::Pronounceable(opts) => (self.generate_pronounceable(opts), GenerationType::Pronounceable),
            GenerationOptions::Passphrase(opts) => (self.generate_passphrase(opts), GenerationType::Passphrase),
            GenerationOptions::Pin(length) => (self.generate_pin(*length), GenerationType::Pin),
            GenerationOptions::Pattern(pattern) => (self.generate_pattern(pattern), GenerationType::Pattern),
        };

        let analysis = self.analyze(&password);
        let now = Utc::now();

        let generated = GeneratedPassword {
            id: Uuid::new_v4().to_string(),
            password: password.clone(),
            strength: analysis.strength.clone(),
            entropy_bits: analysis.entropy_bits,
            generation_type: generation_type.clone(),
            options_used: options,
            domain: domain.clone(),
            created_at: now,
        };

        // Add to history
        let history_entry = PasswordHistory {
            id: generated.id.clone(),
            password_preview: self.create_preview(&password),
            full_password: Some(password),
            strength: analysis.strength,
            generation_type,
            domain,
            created_at: now,
        };

        let mut history = self.history.write().unwrap();
        history.insert(0, history_entry);
        if history.len() > 100 {
            history.truncate(100);
        }

        generated
    }

    fn generate_random(&self, options: &PasswordOptions) -> String {
        let mut rng = rand::thread_rng();
        let mut charset = String::new();

        if options.include_uppercase {
            let mut chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".to_string();
            if options.exclude_ambiguous {
                chars = chars.replace(&['O', 'I'][..], "");
            }
            charset.push_str(&chars);
        }

        if options.include_lowercase {
            let mut chars = "abcdefghijklmnopqrstuvwxyz".to_string();
            if options.exclude_ambiguous {
                chars = chars.replace(&['l', 'o'][..], "");
            }
            charset.push_str(&chars);
        }

        if options.include_numbers {
            let mut chars = "0123456789".to_string();
            if options.exclude_ambiguous {
                chars = chars.replace(&['0', '1'][..], "");
            }
            charset.push_str(&chars);
        }

        if options.include_symbols {
            charset.push_str(&options.symbols);
        }

        // Remove custom exclusions
        for c in options.custom_exclusions.chars() {
            charset = charset.replace(c, "");
        }

        if charset.is_empty() {
            charset = "abcdefghijklmnopqrstuvwxyz".to_string();
        }

        let charset: Vec<char> = charset.chars().collect();
        let mut password = String::new();
        let mut last_char: Option<char> = None;

        for _ in 0..options.length {
            loop {
                let idx = rng.gen_range(0..charset.len());
                let c = charset[idx];

                // Check no repeating
                if options.no_repeating && last_char == Some(c) {
                    continue;
                }

                // Check no sequential
                if options.no_sequential {
                    if let Some(last) = last_char {
                        if (c as i32 - last as i32).abs() == 1 {
                            continue;
                        }
                    }
                }

                password.push(c);
                last_char = Some(c);
                break;
            }
        }

        // Ensure each type is included if required
        if options.require_each_type {
            let mut types_needed = Vec::new();
            
            if options.include_uppercase && !password.chars().any(|c| c.is_uppercase()) {
                types_needed.push('U');
            }
            if options.include_lowercase && !password.chars().any(|c| c.is_lowercase()) {
                types_needed.push('L');
            }
            if options.include_numbers && !password.chars().any(|c| c.is_numeric()) {
                types_needed.push('N');
            }
            if options.include_symbols && !password.chars().any(|c| options.symbols.contains(c)) {
                types_needed.push('S');
            }

            for type_char in types_needed {
                let replacement = match type_char {
                    'U' => 'A',
                    'L' => 'a',
                    'N' => '2',
                    'S' => '!',
                    _ => 'a',
                };
                
                let pos = rng.gen_range(0..password.len());
                let mut chars: Vec<char> = password.chars().collect();
                chars[pos] = replacement;
                password = chars.into_iter().collect();
            }
        }

        password
    }

    fn generate_pronounceable(&self, options: &PronounceableSettings) -> String {
        let mut rng = rand::thread_rng();
        let consonants = "bcdfghjklmnpqrstvwxyz";
        let vowels = "aeiou";
        
        let consonants: Vec<char> = consonants.chars().collect();
        let vowels: Vec<char> = vowels.chars().collect();

        let mut password = String::new();

        for _ in 0..options.syllable_count {
            // CV or CVC pattern
            password.push(consonants[rng.gen_range(0..consonants.len())]);
            password.push(vowels[rng.gen_range(0..vowels.len())]);
            
            if rng.gen_bool(0.5) {
                password.push(consonants[rng.gen_range(0..consonants.len())]);
            }
        }

        if options.capitalize_first {
            password = password.chars().enumerate()
                .map(|(i, c)| if i == 0 { c.to_uppercase().next().unwrap_or(c) } else { c })
                .collect();
        }

        if options.add_number {
            password.push_str(&rng.gen_range(0..100).to_string());
        }

        if options.add_symbol {
            let symbols = "!@#$%";
            let symbols: Vec<char> = symbols.chars().collect();
            password.push(symbols[rng.gen_range(0..symbols.len())]);
        }

        password
    }

    fn generate_passphrase(&self, options: &PassphraseSettings) -> String {
        let mut rng = rand::thread_rng();
        
        let filtered_words: Vec<&String> = self.word_list.iter()
            .filter(|w| {
                let len = w.len() as u32;
                len >= options.min_word_length && len <= options.max_word_length
            })
            .collect();

        let mut words: Vec<String> = (0..options.word_count)
            .map(|_| {
                let word = filtered_words[rng.gen_range(0..filtered_words.len())].clone();
                match options.capitalize {
                    CapitalizeOption::None => word,
                    CapitalizeOption::First => {
                        let mut chars: Vec<char> = word.chars().collect();
                        if !chars.is_empty() {
                            chars[0] = chars[0].to_uppercase().next().unwrap_or(chars[0]);
                        }
                        chars.into_iter().collect()
                    }
                    CapitalizeOption::All => word.to_uppercase(),
                    CapitalizeOption::Random => {
                        if rng.gen_bool(0.5) {
                            let mut chars: Vec<char> = word.chars().collect();
                            if !chars.is_empty() {
                                chars[0] = chars[0].to_uppercase().next().unwrap_or(chars[0]);
                            }
                            chars.into_iter().collect()
                        } else {
                            word
                        }
                    }
                }
            })
            .collect();

        if options.add_number {
            let number = rng.gen_range(0..100).to_string();
            match options.number_position {
                NumberPosition::Start => words.insert(0, number),
                NumberPosition::End => words.push(number),
                NumberPosition::Random => {
                    let pos = rng.gen_range(0..=words.len());
                    words.insert(pos, number);
                }
                NumberPosition::BetweenWords => {
                    if words.len() >= 2 {
                        let pos = rng.gen_range(1..words.len());
                        words.insert(pos, number);
                    } else {
                        words.push(number);
                    }
                }
            }
        }

        words.join(&options.separator)
    }

    fn generate_pin(&self, length: u32) -> String {
        let mut rng = rand::thread_rng();
        (0..length)
            .map(|_| rng.gen_range(0..10).to_string())
            .collect()
    }

    fn generate_pattern(&self, pattern: &str) -> String {
        let mut rng = rand::thread_rng();
        let uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let lowercase = "abcdefghijklmnopqrstuvwxyz";
        let numbers = "0123456789";
        let symbols = "!@#$%^&*";

        pattern.chars().map(|c| {
            match c {
                'A' => uppercase.chars().nth(rng.gen_range(0..uppercase.len())).unwrap(),
                'a' => lowercase.chars().nth(rng.gen_range(0..lowercase.len())).unwrap(),
                '0' => numbers.chars().nth(rng.gen_range(0..numbers.len())).unwrap(),
                '#' => symbols.chars().nth(rng.gen_range(0..symbols.len())).unwrap(),
                '*' => {
                    let all = format!("{}{}{}{}", uppercase, lowercase, numbers, symbols);
                    all.chars().nth(rng.gen_range(0..all.len())).unwrap()
                }
                _ => c,
            }
        }).collect()
    }

    fn create_preview(&self, password: &str) -> String {
        if password.len() <= 4 {
            "****".to_string()
        } else {
            format!("{}...{}", &password[..2], &password[password.len()-2..])
        }
    }

    // ==================== Password Analysis ====================

    pub fn analyze(&self, password: &str) -> PasswordAnalysis {
        let mut issues = Vec::new();
        let mut suggestions = Vec::new();

        let composition = self.analyze_composition(password);
        let entropy = self.calculate_entropy(password);

        // Check length
        if password.len() < 8 {
            issues.push(PasswordIssue {
                severity: IssueSeverity::Critical,
                issue_type: IssueType::TooShort,
                description: "Password is too short (minimum 8 characters)".to_string(),
            });
            suggestions.push("Use at least 12 characters for better security".to_string());
        }

        // Check character types
        if composition.uppercase_count == 0 {
            issues.push(PasswordIssue {
                severity: IssueSeverity::Medium,
                issue_type: IssueType::NoUppercase,
                description: "No uppercase letters".to_string(),
            });
        }

        if composition.lowercase_count == 0 {
            issues.push(PasswordIssue {
                severity: IssueSeverity::Medium,
                issue_type: IssueType::NoLowercase,
                description: "No lowercase letters".to_string(),
            });
        }

        if composition.number_count == 0 {
            issues.push(PasswordIssue {
                severity: IssueSeverity::Low,
                issue_type: IssueType::NoNumbers,
                description: "No numbers".to_string(),
            });
        }

        if composition.symbol_count == 0 {
            issues.push(PasswordIssue {
                severity: IssueSeverity::Low,
                issue_type: IssueType::NoSymbols,
                description: "No special characters".to_string(),
            });
            suggestions.push("Add special characters like !@#$%".to_string());
        }

        // Check for repeating characters
        if self.has_repeating_chars(password, 3) {
            issues.push(PasswordIssue {
                severity: IssueSeverity::Medium,
                issue_type: IssueType::RepeatingChars,
                description: "Contains repeating characters".to_string(),
            });
        }

        // Check for sequential characters
        if self.has_sequential_chars(password, 3) {
            issues.push(PasswordIssue {
                severity: IssueSeverity::Medium,
                issue_type: IssueType::SequentialChars,
                description: "Contains sequential characters".to_string(),
            });
        }

        // Calculate strength
        let (strength, score) = self.calculate_strength(&composition, entropy, &issues);

        // Calculate crack times
        let crack_time = self.calculate_crack_time(entropy);

        PasswordAnalysis {
            strength,
            score,
            entropy_bits: entropy,
            crack_time,
            issues,
            suggestions,
            character_composition: composition,
        }
    }

    fn analyze_composition(&self, password: &str) -> CharacterComposition {
        let mut uppercase = 0u32;
        let mut lowercase = 0u32;
        let mut numbers = 0u32;
        let mut symbols = 0u32;
        let mut unique: std::collections::HashSet<char> = std::collections::HashSet::new();

        for c in password.chars() {
            unique.insert(c);
            if c.is_uppercase() {
                uppercase += 1;
            } else if c.is_lowercase() {
                lowercase += 1;
            } else if c.is_numeric() {
                numbers += 1;
            } else {
                symbols += 1;
            }
        }

        CharacterComposition {
            length: password.len() as u32,
            uppercase_count: uppercase,
            lowercase_count: lowercase,
            number_count: numbers,
            symbol_count: symbols,
            unique_chars: unique.len() as u32,
        }
    }

    fn calculate_entropy(&self, password: &str) -> f64 {
        let mut charset_size = 0u32;
        let mut has_upper = false;
        let mut has_lower = false;
        let mut has_number = false;
        let mut has_symbol = false;

        for c in password.chars() {
            if c.is_uppercase() && !has_upper {
                has_upper = true;
                charset_size += 26;
            } else if c.is_lowercase() && !has_lower {
                has_lower = true;
                charset_size += 26;
            } else if c.is_numeric() && !has_number {
                has_number = true;
                charset_size += 10;
            } else if !c.is_alphanumeric() && !has_symbol {
                has_symbol = true;
                charset_size += 32;
            }
        }

        if charset_size == 0 {
            charset_size = 26;
        }

        (password.len() as f64) * (charset_size as f64).log2()
    }

    fn calculate_strength(&self, composition: &CharacterComposition, entropy: f64, issues: &[PasswordIssue]) -> (PasswordStrength, u32) {
        let mut score = 0u32;

        // Length score
        score += (composition.length as u32).min(20);

        // Diversity score
        if composition.uppercase_count > 0 { score += 10; }
        if composition.lowercase_count > 0 { score += 10; }
        if composition.number_count > 0 { score += 10; }
        if composition.symbol_count > 0 { score += 15; }

        // Entropy score
        score += (entropy / 4.0) as u32;

        // Penalize issues
        for issue in issues {
            match issue.severity {
                IssueSeverity::Critical => score = score.saturating_sub(25),
                IssueSeverity::High => score = score.saturating_sub(15),
                IssueSeverity::Medium => score = score.saturating_sub(10),
                IssueSeverity::Low => score = score.saturating_sub(5),
            }
        }

        let strength = match score {
            0..=20 => PasswordStrength::VeryWeak,
            21..=40 => PasswordStrength::Weak,
            41..=60 => PasswordStrength::Fair,
            61..=80 => PasswordStrength::Strong,
            _ => PasswordStrength::VeryStrong,
        };

        (strength, score.min(100))
    }

    fn calculate_crack_time(&self, entropy: f64) -> CrackTime {
        let guesses = 2f64.powf(entropy);

        // Guesses per second for different scenarios
        let online_throttled = 100.0;
        let online_unthrottled = 10_000.0;
        let offline_slow = 10_000_000.0;
        let offline_fast = 10_000_000_000.0;

        CrackTime {
            online_throttled: Self::format_time(guesses / online_throttled),
            online_unthrottled: Self::format_time(guesses / online_unthrottled),
            offline_slow: Self::format_time(guesses / offline_slow),
            offline_fast: Self::format_time(guesses / offline_fast),
        }
    }

    fn format_time(seconds: f64) -> String {
        if seconds < 1.0 {
            "instant".to_string()
        } else if seconds < 60.0 {
            format!("{:.0} seconds", seconds)
        } else if seconds < 3600.0 {
            format!("{:.0} minutes", seconds / 60.0)
        } else if seconds < 86400.0 {
            format!("{:.0} hours", seconds / 3600.0)
        } else if seconds < 31536000.0 {
            format!("{:.0} days", seconds / 86400.0)
        } else if seconds < 3153600000.0 {
            format!("{:.0} years", seconds / 31536000.0)
        } else {
            "centuries".to_string()
        }
    }

    fn has_repeating_chars(&self, password: &str, count: usize) -> bool {
        let chars: Vec<char> = password.chars().collect();
        for i in 0..chars.len().saturating_sub(count - 1) {
            if chars[i..i+count].iter().all(|&c| c == chars[i]) {
                return true;
            }
        }
        false
    }

    fn has_sequential_chars(&self, password: &str, count: usize) -> bool {
        let chars: Vec<char> = password.chars().collect();
        for i in 0..chars.len().saturating_sub(count - 1) {
            let mut is_seq = true;
            for j in 1..count {
                if (chars[i+j] as i32 - chars[i+j-1] as i32).abs() != 1 {
                    is_seq = false;
                    break;
                }
            }
            if is_seq {
                return true;
            }
        }
        false
    }

    // ==================== History ====================

    pub fn get_history(&self, limit: Option<u32>) -> Vec<PasswordHistory> {
        let history = self.history.read().unwrap();
        let limit = limit.unwrap_or(50) as usize;
        history.iter().take(limit).cloned().collect()
    }

    pub fn clear_history(&self) {
        self.history.write().unwrap().clear();
    }

    // ==================== Templates ====================

    pub fn get_template(&self, template_id: &str) -> Option<PasswordTemplate> {
        self.templates.read().unwrap().get(template_id).cloned()
    }

    pub fn get_all_templates(&self) -> Vec<PasswordTemplate> {
        self.templates.read().unwrap().values().cloned().collect()
    }

    pub fn create_template(&self, name: String, description: String, generation_type: GenerationType, options: GenerationOptions) -> PasswordTemplate {
        let template = PasswordTemplate {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            generation_type,
            options,
            is_favorite: false,
            use_count: 0,
            created_at: Utc::now(),
        };

        let id = template.id.clone();
        self.templates.write().unwrap().insert(id, template.clone());

        template
    }

    pub fn delete_template(&self, template_id: &str) -> Result<(), String> {
        self.templates.write().unwrap()
            .remove(template_id)
            .ok_or_else(|| "Template not found".to_string())?;
        Ok(())
    }

    pub fn generate_from_template(&self, template_id: &str, domain: Option<String>) -> Result<GeneratedPassword, String> {
        let mut templates = self.templates.write().unwrap();
        let template = templates.get_mut(template_id)
            .ok_or_else(|| "Template not found".to_string())?;

        template.use_count += 1;
        let options = template.options.clone();
        drop(templates);

        Ok(self.generate(options, domain))
    }

    // ==================== Stats ====================

    pub fn get_stats(&self) -> GeneratorStats {
        let history = self.history.read().unwrap();
        let templates = self.templates.read().unwrap();

        let mut by_type: HashMap<String, u32> = HashMap::new();
        let mut by_strength: HashMap<String, u32> = HashMap::new();
        let mut total_length = 0u32;
        let mut total_entropy = 0f64;

        for entry in history.iter() {
            *by_type.entry(format!("{:?}", entry.generation_type)).or_insert(0) += 1;
            *by_strength.entry(format!("{:?}", entry.strength)).or_insert(0) += 1;
            
            if let Some(ref pwd) = entry.full_password {
                total_length += pwd.len() as u32;
                total_entropy += self.calculate_entropy(pwd);
            }
        }

        let count = history.len() as f32;
        let avg_length = if count > 0.0 { total_length as f32 / count } else { 0.0 };
        let avg_entropy = if count > 0.0 { total_entropy as f32 / count } else { 0.0 };

        let mut most_used: Vec<(String, u32)> = templates.values()
            .map(|t| (t.name.clone(), t.use_count))
            .collect();
        most_used.sort_by(|a, b| b.1.cmp(&a.1));
        most_used.truncate(5);

        GeneratorStats {
            total_generated: history.len() as u64,
            by_type,
            by_strength,
            average_length: avg_length,
            average_entropy: avg_entropy,
            most_used_templates: most_used,
        }
    }
}

impl Default for BrowserPasswordGeneratorService {
    fn default() -> Self {
        Self::new()
    }
}
