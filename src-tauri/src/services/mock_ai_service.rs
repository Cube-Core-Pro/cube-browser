// Mock AI Service - Simulated OpenAI responses for UI testing
// This allows complete UI testing without requiring a real OpenAI API key
// Production-quality mock responses with realistic data and timing

use std::time::Duration;
use tokio::time::sleep;

// Import types from real AI service
use super::ai_service::{AISelector, AIWorkflow, WorkflowStep};

// ============================================================================
// MOCK AI SERVICE
// ============================================================================

pub struct MockAIService {
    response_delay_ms: u64, // Simulate network latency (realistic: 1000-3000ms)
}

impl MockAIService {
    pub fn new() -> Self {
        Self {
            response_delay_ms: 1500, // 1.5 second realistic delay
        }
    }

    /// Simulate network delay (makes mock responses realistic)
    async fn simulate_delay(&self) {
        sleep(Duration::from_millis(self.response_delay_ms)).await;
    }

    /// Generate mock smart CSS selector suggestions
    pub async fn suggest_selectors(
        &self,
        element_description: &str,
        _page_html: &str,
    ) -> Result<Vec<AISelector>, String> {
        self.simulate_delay().await;

        // Generate realistic selector suggestions based on common patterns
        let suggestions = match element_description.to_lowercase().as_str() {
            desc if desc.contains("price") || desc.contains("cost") || desc.contains("amount") => {
                vec![
                    AISelector {
                        selector: ".price, [data-price], .amount".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.92,
                        reasoning: "Price elements typically use .price class or data-price attributes. High confidence due to common e-commerce patterns.".to_string(),
                        example_values: vec!["$29.99".to_string(), "$149.00".to_string(), "$5.50".to_string()],
                    },
                    AISelector {
                        selector: "span.currency-value, div[itemprop='price']".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.85,
                        reasoning: "Schema.org markup often used for SEO. Semantic approach with good stability.".to_string(),
                        example_values: vec!["29.99".to_string(), "149.00".to_string()],
                    },
                    AISelector {
                        selector: "#product-price, .product__price".to_string(),
                        strategy: "single".to_string(),
                        confidence: 0.78,
                        reasoning: "Common BEM naming convention for product pages. May fail on multi-product pages.".to_string(),
                        example_values: vec!["$29.99".to_string()],
                    },
                ]
            }
            desc if desc.contains("title") || desc.contains("heading") || desc.contains("name") => {
                vec![
                    AISelector {
                        selector: "h1, h2.title, [data-title]".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.95,
                        reasoning: "Heading elements are semantically correct and stable across page updates. Very high confidence.".to_string(),
                        example_values: vec!["Product Name".to_string(), "Article Title".to_string(), "Page Heading".to_string()],
                    },
                    AISelector {
                        selector: ".product-title, .article-heading".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.88,
                        reasoning: "Common class names for content titles. Good balance of specificity and flexibility.".to_string(),
                        example_values: vec!["Main Title".to_string(), "Subheading".to_string()],
                    },
                    AISelector {
                        selector: "[itemprop='name'], meta[property='og:title']".to_string(),
                        strategy: "single".to_string(),
                        confidence: 0.82,
                        reasoning: "Structured data and Open Graph tags. Reliable but may not be visible text.".to_string(),
                        example_values: vec!["SEO Title".to_string()],
                    },
                ]
            }
            desc if desc.contains("button")
                || desc.contains("submit")
                || desc.contains("click") =>
            {
                vec![
                    AISelector {
                        selector: "button[type='submit'], input[type='submit']".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.93,
                        reasoning: "Native form submit elements. Highly stable and semantically correct approach.".to_string(),
                        example_values: vec!["Submit".to_string(), "Sign Up".to_string(), "Continue".to_string()],
                    },
                    AISelector {
                        selector: ".btn-primary, .submit-button, [data-action='submit']".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.86,
                        reasoning: "Common button class patterns and data attributes. Good cross-framework compatibility.".to_string(),
                        example_values: vec!["Click Here".to_string(), "Get Started".to_string()],
                    },
                    AISelector {
                        selector: "a.cta-button, div[role='button']".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.79,
                        reasoning: "Alternative button implementations. Less stable but covers edge cases.".to_string(),
                        example_values: vec!["Learn More".to_string(), "Buy Now".to_string()],
                    },
                ]
            }
            desc if desc.contains("table") || desc.contains("row") || desc.contains("data") => {
                vec![
                    AISelector {
                        selector: "table tbody tr".to_string(),
                        strategy: "table".to_string(),
                        confidence: 0.94,
                        reasoning: "Standard table structure. Excellent for extracting tabular data with headers and multiple rows.".to_string(),
                        example_values: vec!["Row 1 Data".to_string(), "Row 2 Data".to_string(), "Row 3 Data".to_string()],
                    },
                    AISelector {
                        selector: ".data-table .table-row, [data-table-row]".to_string(),
                        strategy: "list".to_string(),
                        confidence: 0.87,
                        reasoning: "Custom table implementations using divs. Common in modern frameworks like React/Vue.".to_string(),
                        example_values: vec!["Item 1".to_string(), "Item 2".to_string()],
                    },
                    AISelector {
                        selector: "ul.data-list li, ol.results > li".to_string(),
                        strategy: "list".to_string(),
                        confidence: 0.81,
                        reasoning: "List-based data structures. Good for sequential data extraction.".to_string(),
                        example_values: vec!["List Item 1".to_string(), "List Item 2".to_string()],
                    },
                ]
            }
            desc if desc.contains("image") || desc.contains("img") || desc.contains("photo") => {
                vec![
                    AISelector {
                        selector: "img[src], picture source".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.96,
                        reasoning: "Standard image elements. Highest confidence for image extraction.".to_string(),
                        example_values: vec!["/images/product1.jpg".to_string(), "/images/hero.png".to_string()],
                    },
                    AISelector {
                        selector: "[data-image], .gallery-image, .product-image".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.89,
                        reasoning: "Common image container classes. Useful for lazy-loaded or background images.".to_string(),
                        example_values: vec!["image-url-1".to_string(), "image-url-2".to_string()],
                    },
                    AISelector {
                        selector: "div[style*='background-image'], [data-bg]".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.75,
                        reasoning: "Background images via CSS. Lower confidence but covers non-standard implementations.".to_string(),
                        example_values: vec!["url(/bg.jpg)".to_string()],
                    },
                ]
            }
            desc if desc.contains("link") || desc.contains("url") || desc.contains("href") => {
                vec![
                    AISelector {
                        selector: "a[href], link[rel='canonical']".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.97,
                        reasoning:
                            "Standard anchor elements. Extremely stable and semantically correct."
                                .to_string(),
                        example_values: vec![
                            "/page1".to_string(),
                            "/page2".to_string(),
                            "https://example.com".to_string(),
                        ],
                    },
                    AISelector {
                        selector: ".nav-link, .menu-item a, [data-link]".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.90,
                        reasoning:
                            "Navigation links with common class patterns. Good for menu extraction."
                                .to_string(),
                        example_values: vec![
                            "Home".to_string(),
                            "About".to_string(),
                            "Contact".to_string(),
                        ],
                    },
                    AISelector {
                        selector: "a.product-link, [data-product-url]".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.83,
                        reasoning: "Product-specific links. Useful for e-commerce scraping."
                            .to_string(),
                        example_values: vec!["/product/123".to_string(), "/item/456".to_string()],
                    },
                ]
            }
            // Default fallback for generic elements
            _ => {
                vec![
                    AISelector {
                        selector: format!("[data-{}], .{}, #{}", 
                            element_description.to_lowercase().replace(" ", "-"),
                            element_description.to_lowercase().replace(" ", "-"),
                            element_description.to_lowercase().replace(" ", "-")
                        ),
                        strategy: "multiple".to_string(),
                        confidence: 0.70,
                        reasoning: format!("Generic selector based on element description '{}'. May need manual refinement.", element_description),
                        example_values: vec!["Sample Value 1".to_string(), "Sample Value 2".to_string()],
                    },
                    AISelector {
                        selector: "div, span, p".to_string(),
                        strategy: "multiple".to_string(),
                        confidence: 0.50,
                        reasoning: "Very broad selector. Will capture many elements. Requires manual filtering.".to_string(),
                        example_values: vec!["Generic text 1".to_string(), "Generic text 2".to_string()],
                    },
                    AISelector {
                        selector: "*[class*='content'], *[id*='main']".to_string(),
                        strategy: "single".to_string(),
                        confidence: 0.45,
                        reasoning: "Wildcard approach for unknown structures. Low confidence, use as last resort.".to_string(),
                        example_values: vec!["Content area".to_string()],
                    },
                ]
            }
        };

        Ok(suggestions)
    }

    /// Generate mock natural language to workflow conversion
    pub async fn natural_language_to_workflow(
        &self,
        description: &str,
    ) -> Result<AIWorkflow, String> {
        self.simulate_delay().await;

        // Parse common automation patterns
        let workflow = match description.to_lowercase().as_str() {
            desc if desc.contains("login") || desc.contains("sign in") => AIWorkflow {
                name: "Login to Website".to_string(),
                description: "Automated login workflow with username and password".to_string(),
                steps: vec![
                    WorkflowStep {
                        action: "navigate".to_string(),
                        selector: None,
                        value: Some("https://example.com/login".to_string()),
                        description: "Navigate to login page".to_string(),
                    },
                    WorkflowStep {
                        action: "type".to_string(),
                        selector: Some("input[name='username'], #username".to_string()),
                        value: Some("{{username}}".to_string()),
                        description: "Enter username in login field".to_string(),
                    },
                    WorkflowStep {
                        action: "type".to_string(),
                        selector: Some(
                            "input[name='password'], #password, input[type='password']".to_string(),
                        ),
                        value: Some("{{password}}".to_string()),
                        description: "Enter password in password field".to_string(),
                    },
                    WorkflowStep {
                        action: "click".to_string(),
                        selector: Some(
                            "button[type='submit'], .login-button, input[type='submit']"
                                .to_string(),
                        ),
                        value: None,
                        description: "Click login button to submit form".to_string(),
                    },
                    WorkflowStep {
                        action: "wait".to_string(),
                        selector: Some(".dashboard, .user-profile, [data-logged-in]".to_string()),
                        value: Some("5000".to_string()),
                        description: "Wait for dashboard to load (max 5 seconds)".to_string(),
                    },
                ],
                confidence: 0.95,
            },
            desc if desc.contains("search") || desc.contains("find") => AIWorkflow {
                name: "Search and Extract Results".to_string(),
                description: "Search for items and extract results data".to_string(),
                steps: vec![
                    WorkflowStep {
                        action: "navigate".to_string(),
                        selector: None,
                        value: Some("https://example.com".to_string()),
                        description: "Navigate to website homepage".to_string(),
                    },
                    WorkflowStep {
                        action: "type".to_string(),
                        selector: Some("input[type='search'], #search, .search-input".to_string()),
                        value: Some("{{search_query}}".to_string()),
                        description: "Enter search query in search box".to_string(),
                    },
                    WorkflowStep {
                        action: "click".to_string(),
                        selector: Some(
                            "button[type='submit'], .search-button, [aria-label='Search']"
                                .to_string(),
                        ),
                        value: None,
                        description: "Click search button".to_string(),
                    },
                    WorkflowStep {
                        action: "wait".to_string(),
                        selector: Some(".search-results, .results-list".to_string()),
                        value: Some("3000".to_string()),
                        description: "Wait for search results to load".to_string(),
                    },
                    WorkflowStep {
                        action: "extract".to_string(),
                        selector: Some(".result-item, .search-result".to_string()),
                        value: None,
                        description: "Extract all search result items".to_string(),
                    },
                ],
                confidence: 0.92,
            },
            desc if desc.contains("form") || desc.contains("fill") || desc.contains("submit") => {
                AIWorkflow {
                    name: "Fill and Submit Form".to_string(),
                    description: "Automated form filling with validation".to_string(),
                    steps: vec![
                        WorkflowStep {
                            action: "navigate".to_string(),
                            selector: None,
                            value: Some("https://example.com/form".to_string()),
                            description: "Navigate to form page".to_string(),
                        },
                        WorkflowStep {
                            action: "type".to_string(),
                            selector: Some("input[name='name'], #name, .form-name".to_string()),
                            value: Some("{{user_name}}".to_string()),
                            description: "Fill name field".to_string(),
                        },
                        WorkflowStep {
                            action: "type".to_string(),
                            selector: Some("input[type='email'], #email".to_string()),
                            value: Some("{{user_email}}".to_string()),
                            description: "Fill email field".to_string(),
                        },
                        WorkflowStep {
                            action: "select".to_string(),
                            selector: Some("select[name='country'], #country".to_string()),
                            value: Some("{{country}}".to_string()),
                            description: "Select country from dropdown".to_string(),
                        },
                        WorkflowStep {
                            action: "click".to_string(),
                            selector: Some("input[type='checkbox']#terms".to_string()),
                            value: None,
                            description: "Accept terms and conditions".to_string(),
                        },
                        WorkflowStep {
                            action: "click".to_string(),
                            selector: Some("button[type='submit'], .submit-btn".to_string()),
                            value: None,
                            description: "Submit form".to_string(),
                        },
                    ],
                    confidence: 0.90,
                }
            }
            desc if desc.contains("scrape")
                || desc.contains("extract")
                || desc.contains("data") =>
            {
                AIWorkflow {
                    name: "Data Extraction Workflow".to_string(),
                    description: "Extract structured data from multiple pages".to_string(),
                    steps: vec![
                        WorkflowStep {
                            action: "navigate".to_string(),
                            selector: None,
                            value: Some("https://example.com/products".to_string()),
                            description: "Navigate to products listing page".to_string(),
                        },
                        WorkflowStep {
                            action: "wait".to_string(),
                            selector: Some(".product-list, .products-grid".to_string()),
                            value: Some("2000".to_string()),
                            description: "Wait for products to load".to_string(),
                        },
                        WorkflowStep {
                            action: "extract".to_string(),
                            selector: Some(".product-title, h2.title".to_string()),
                            value: None,
                            description: "Extract product titles".to_string(),
                        },
                        WorkflowStep {
                            action: "extract".to_string(),
                            selector: Some(".product-price, .price".to_string()),
                            value: None,
                            description: "Extract product prices".to_string(),
                        },
                        WorkflowStep {
                            action: "extract".to_string(),
                            selector: Some(".product-link, a.product-url".to_string()),
                            value: None,
                            description: "Extract product links for detail pages".to_string(),
                        },
                    ],
                    confidence: 0.88,
                }
            }
            desc if desc.contains("pagination")
                || desc.contains("next page")
                || desc.contains("multiple pages") =>
            {
                AIWorkflow {
                    name: "Paginated Data Extraction".to_string(),
                    description: "Extract data across multiple pages with pagination".to_string(),
                    steps: vec![
                        WorkflowStep {
                            action: "navigate".to_string(),
                            selector: None,
                            value: Some("https://example.com/list".to_string()),
                            description: "Navigate to first page".to_string(),
                        },
                        WorkflowStep {
                            action: "loop_start".to_string(),
                            selector: Some(".next-page, .pagination-next".to_string()),
                            value: Some("10".to_string()),
                            description: "Start pagination loop (max 10 pages)".to_string(),
                        },
                        WorkflowStep {
                            action: "extract".to_string(),
                            selector: Some(".item, .list-item".to_string()),
                            value: None,
                            description: "Extract items from current page".to_string(),
                        },
                        WorkflowStep {
                            action: "click".to_string(),
                            selector: Some("a.next-page, button[aria-label='Next']".to_string()),
                            value: None,
                            description: "Click next page button".to_string(),
                        },
                        WorkflowStep {
                            action: "wait".to_string(),
                            selector: Some(".item, .list-item".to_string()),
                            value: Some("2000".to_string()),
                            description: "Wait for next page to load".to_string(),
                        },
                        WorkflowStep {
                            action: "loop_end".to_string(),
                            selector: None,
                            value: None,
                            description: "End pagination loop".to_string(),
                        },
                    ],
                    confidence: 0.85,
                }
            }
            // Default generic workflow
            _ => AIWorkflow {
                name: "Custom Workflow".to_string(),
                description: format!("Generic workflow for: {}", description),
                steps: vec![
                    WorkflowStep {
                        action: "navigate".to_string(),
                        selector: None,
                        value: Some("https://example.com".to_string()),
                        description: "Navigate to target website".to_string(),
                    },
                    WorkflowStep {
                        action: "wait".to_string(),
                        selector: Some("body".to_string()),
                        value: Some("2000".to_string()),
                        description: "Wait for page to load".to_string(),
                    },
                    WorkflowStep {
                        action: "extract".to_string(),
                        selector: Some(".content, #main".to_string()),
                        value: None,
                        description: "Extract main content".to_string(),
                    },
                ],
                confidence: 0.65,
            },
        };

        Ok(workflow)
    }

    /// Generate mock selector improvement suggestions
    pub async fn improve_selector(
        &self,
        current_selector: &str,
        _page_html: &str,
    ) -> Result<AISelector, String> {
        self.simulate_delay().await;

        // Analyze current selector and suggest improvements
        let improved = if current_selector.contains("nth-child")
            || current_selector.contains("nth-of-type")
        {
            // Brittle index-based selector - suggest semantic alternative
            AISelector {
                selector: "[data-testid], .component-class, #unique-id".to_string(),
                strategy: "single".to_string(),
                confidence: 0.90,
                reasoning: format!(
                    "Your current selector '{}' uses positional indexes which break when page structure changes. \
                    Recommendation: Use data-testid attributes, semantic classes, or unique IDs instead.",
                    current_selector
                ),
                example_values: vec!["Improved stability".to_string()],
            }
        } else if current_selector.split(' ').count() > 5 {
            // Overly specific selector - suggest simplification
            AISelector {
                selector: current_selector
                    .split(' ')
                    .take(3)
                    .collect::<Vec<_>>()
                    .join(" "),
                strategy: "single".to_string(),
                confidence: 0.85,
                reasoning: format!(
                    "Your current selector '{}' is too specific with {} levels of nesting. \
                    Simplified version is more maintainable and equally effective.",
                    current_selector,
                    current_selector.split(' ').count()
                ),
                example_values: vec!["Simplified selector".to_string()],
            }
        } else if !current_selector.contains('.')
            && !current_selector.contains('#')
            && !current_selector.contains('[')
        {
            // Tag-only selector - suggest class/attribute targeting
            AISelector {
                selector: format!("{}.specific-class, {}[data-role]", current_selector, current_selector),
                strategy: "single".to_string(),
                confidence: 0.88,
                reasoning: format!(
                    "Your current selector '{}' uses only tag names which may be too broad. \
                    Adding class or attribute selectors improves precision and reduces false positives.",
                    current_selector
                ),
                example_values: vec!["More precise targeting".to_string()],
            }
        } else {
            // Selector looks good - minor optimization
            AISelector {
                selector: current_selector.to_string(),
                strategy: "single".to_string(),
                confidence: 0.95,
                reasoning: format!(
                    "Your current selector '{}' is well-structured and stable. \
                    It uses good practices: semantic targeting, reasonable specificity. \
                    No significant improvements needed.",
                    current_selector
                ),
                example_values: vec!["Already optimal".to_string()],
            }
        };

        Ok(improved)
    }

    /// Generate mock extraction schema from description
    pub async fn suggest_extraction_schema(
        &self,
        description: &str,
    ) -> Result<serde_json::Value, String> {
        self.simulate_delay().await;

        // Generate realistic schema based on description
        let schema = match description.to_lowercase().as_str() {
            desc if desc.contains("product")
                || desc.contains("e-commerce")
                || desc.contains("shop") =>
            {
                serde_json::json!({
                    "schema_name": "E-commerce Product",
                    "description": "Comprehensive product data extraction schema",
                    "fields": [
                        {
                            "name": "title",
                            "selector": "h1.product-title, .product-name, [itemprop='name']",
                            "type": "text",
                            "required": true,
                            "description": "Product title/name"
                        },
                        {
                            "name": "price",
                            "selector": ".price, [data-price], [itemprop='price']",
                            "type": "number",
                            "required": true,
                            "description": "Current product price",
                            "transform": "parseFloat"
                        },
                        {
                            "name": "currency",
                            "selector": "[itemprop='priceCurrency'], .currency",
                            "type": "text",
                            "required": false,
                            "description": "Currency code (USD, EUR, etc.)"
                        },
                        {
                            "name": "description",
                            "selector": ".product-description, [itemprop='description']",
                            "type": "text",
                            "required": false,
                            "description": "Full product description"
                        },
                        {
                            "name": "images",
                            "selector": ".product-images img, .gallery img",
                            "type": "array",
                            "required": false,
                            "description": "Product images",
                            "attribute": "src"
                        },
                        {
                            "name": "availability",
                            "selector": ".availability, [itemprop='availability']",
                            "type": "text",
                            "required": false,
                            "description": "Stock availability status"
                        },
                        {
                            "name": "rating",
                            "selector": ".rating, [itemprop='ratingValue']",
                            "type": "number",
                            "required": false,
                            "description": "Customer rating (0-5)",
                            "transform": "parseFloat"
                        },
                        {
                            "name": "reviews_count",
                            "selector": ".reviews-count, [itemprop='reviewCount']",
                            "type": "number",
                            "required": false,
                            "description": "Number of customer reviews",
                            "transform": "parseInt"
                        }
                    ],
                    "confidence": 0.94
                })
            }
            desc if desc.contains("article") || desc.contains("blog") || desc.contains("news") => {
                serde_json::json!({
                    "schema_name": "Article/Blog Post",
                    "description": "News article or blog post extraction schema",
                    "fields": [
                        {
                            "name": "headline",
                            "selector": "h1, .article-title, [itemprop='headline']",
                            "type": "text",
                            "required": true,
                            "description": "Article headline/title"
                        },
                        {
                            "name": "author",
                            "selector": ".author, [rel='author'], [itemprop='author']",
                            "type": "text",
                            "required": false,
                            "description": "Article author name"
                        },
                        {
                            "name": "publish_date",
                            "selector": "time, .publish-date, [itemprop='datePublished']",
                            "type": "date",
                            "required": false,
                            "description": "Publication date",
                            "attribute": "datetime"
                        },
                        {
                            "name": "content",
                            "selector": ".article-content, .post-body, [itemprop='articleBody']",
                            "type": "text",
                            "required": true,
                            "description": "Full article content/body text"
                        },
                        {
                            "name": "excerpt",
                            "selector": ".excerpt, .summary, [itemprop='description']",
                            "type": "text",
                            "required": false,
                            "description": "Article excerpt/summary"
                        },
                        {
                            "name": "featured_image",
                            "selector": ".featured-image img, [itemprop='image']",
                            "type": "text",
                            "required": false,
                            "description": "Featured/hero image URL",
                            "attribute": "src"
                        },
                        {
                            "name": "tags",
                            "selector": ".tags a, .article-tags .tag",
                            "type": "array",
                            "required": false,
                            "description": "Article tags/categories"
                        }
                    ],
                    "confidence": 0.91
                })
            }
            desc if desc.contains("contact")
                || desc.contains("business")
                || desc.contains("company") =>
            {
                serde_json::json!({
                    "schema_name": "Business Contact Information",
                    "description": "Company/business contact details extraction",
                    "fields": [
                        {
                            "name": "company_name",
                            "selector": ".company-name, h1, [itemprop='name']",
                            "type": "text",
                            "required": true,
                            "description": "Business/company name"
                        },
                        {
                            "name": "phone",
                            "selector": ".phone, [itemprop='telephone'], a[href^='tel:']",
                            "type": "text",
                            "required": false,
                            "description": "Contact phone number"
                        },
                        {
                            "name": "email",
                            "selector": ".email, [itemprop='email'], a[href^='mailto:']",
                            "type": "text",
                            "required": false,
                            "description": "Contact email address"
                        },
                        {
                            "name": "address",
                            "selector": ".address, [itemprop='address']",
                            "type": "text",
                            "required": false,
                            "description": "Physical business address"
                        },
                        {
                            "name": "website",
                            "selector": "[itemprop='url'], .website",
                            "type": "text",
                            "required": false,
                            "description": "Company website URL"
                        },
                        {
                            "name": "hours",
                            "selector": ".hours, .opening-hours, [itemprop='openingHours']",
                            "type": "text",
                            "required": false,
                            "description": "Business hours"
                        }
                    ],
                    "confidence": 0.89
                })
            }
            desc if desc.contains("table") || desc.contains("list") || desc.contains("data") => {
                serde_json::json!({
                    "schema_name": "Tabular Data",
                    "description": "Generic table/list data extraction schema",
                    "fields": [
                        {
                            "name": "row_id",
                            "selector": "tr, .table-row",
                            "type": "text",
                            "required": true,
                            "description": "Row identifier/index",
                            "attribute": "data-id"
                        },
                        {
                            "name": "column_1",
                            "selector": "td:nth-child(1), .col-1",
                            "type": "text",
                            "required": true,
                            "description": "First column data"
                        },
                        {
                            "name": "column_2",
                            "selector": "td:nth-child(2), .col-2",
                            "type": "text",
                            "required": false,
                            "description": "Second column data"
                        },
                        {
                            "name": "column_3",
                            "selector": "td:nth-child(3), .col-3",
                            "type": "text",
                            "required": false,
                            "description": "Third column data"
                        }
                    ],
                    "note": "Adjust column selectors based on actual table structure",
                    "confidence": 0.80
                })
            }
            // Default generic schema
            _ => {
                serde_json::json!({
                    "schema_name": "Generic Data Extraction",
                    "description": format!("Custom schema for: {}", description),
                    "fields": [
                        {
                            "name": "main_content",
                            "selector": ".content, #main, article",
                            "type": "text",
                            "required": true,
                            "description": "Primary page content"
                        },
                        {
                            "name": "title",
                            "selector": "h1, h2, .title",
                            "type": "text",
                            "required": false,
                            "description": "Page or section title"
                        },
                        {
                            "name": "links",
                            "selector": "a[href]",
                            "type": "array",
                            "required": false,
                            "description": "All page links",
                            "attribute": "href"
                        }
                    ],
                    "confidence": 0.70,
                    "note": "This is a generic schema. Customize based on actual page structure."
                })
            }
        };

        Ok(schema)
    }
}

impl Default for MockAIService {
    fn default() -> Self {
        Self::new()
    }
}
