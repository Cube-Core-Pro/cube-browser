/**
 * CodeNodeEditor - CUBE Elite v6
 * Editor de nodos de código JavaScript/Python para automatización
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CodeNode, CodeExecutionResult } from '../../types/automation-advanced';
import './CodeNodeEditor.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface CodeNodeEditorProps {
  node?: CodeNode;
  onSave: (node: CodeNode) => void;
  onClose: () => void;
  onExecute?: (code: string, language: string) => Promise<CodeExecutionResult>;
  availableVariables?: { name: string; type: string; value: unknown }[];
  position?: { x: number; y: number };
}

interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  language: 'javascript' | 'python' | 'typescript';
  code: string;
  category: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CODE_TEMPLATES: CodeTemplate[] = [
  // JavaScript Templates
  {
    id: 'js-fetch-api',
    name: 'Fetch API Data',
    description: 'Make HTTP requests to external APIs',
    language: 'javascript',
    category: 'HTTP',
    code: `// Fetch data from an API
async function fetchData(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Add your API key here if needed
      // 'Authorization': 'Bearer YOUR_API_KEY'
    }
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  return await response.json();
}

// Main execution
const apiUrl = input.url || 'https://api.example.com/data';
const result = await fetchData(apiUrl);
return result;`,
  },
  {
    id: 'js-transform-data',
    name: 'Transform Array Data',
    description: 'Map, filter, and reduce data arrays',
    language: 'javascript',
    category: 'Data',
    code: `// Transform array data
const data = input.items || [];

// Filter items
const filtered = data.filter(item => {
  return item.active === true;
});

// Map to new format
const transformed = filtered.map(item => ({
  id: item.id,
  name: item.name.toUpperCase(),
  value: item.price * 1.1, // Add 10%
  timestamp: new Date().toISOString()
}));

// Calculate totals
const total = transformed.reduce((sum, item) => sum + item.value, 0);

return {
  items: transformed,
  count: transformed.length,
  total: total.toFixed(2)
};`,
  },
  {
    id: 'js-parse-html',
    name: 'Parse HTML Content',
    description: 'Extract data from HTML strings',
    language: 'javascript',
    category: 'Parsing',
    code: `// Parse HTML and extract data
const html = input.html || '<div>No content</div>';

// Create a DOM parser
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');

// Extract elements
const titles = Array.from(doc.querySelectorAll('h1, h2, h3'))
  .map(el => el.textContent.trim());

const links = Array.from(doc.querySelectorAll('a[href]'))
  .map(el => ({
    text: el.textContent.trim(),
    url: el.getAttribute('href')
  }));

const images = Array.from(doc.querySelectorAll('img[src]'))
  .map(el => ({
    alt: el.getAttribute('alt'),
    src: el.getAttribute('src')
  }));

return {
  titles,
  links,
  images,
  textContent: doc.body.textContent.trim().substring(0, 1000)
};`,
  },
  {
    id: 'js-date-operations',
    name: 'Date Operations',
    description: 'Work with dates and timestamps',
    language: 'javascript',
    category: 'Utilities',
    code: `// Date manipulation utilities
const inputDate = input.date ? new Date(input.date) : new Date();

// Add/subtract days
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Format date
const formatDate = (date, format = 'YYYY-MM-DD') => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

// Calculate difference
const daysDiff = (date1, date2) => {
  const diff = Math.abs(date2 - date1);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

return {
  original: inputDate.toISOString(),
  formatted: formatDate(inputDate),
  tomorrow: formatDate(addDays(inputDate, 1)),
  nextWeek: formatDate(addDays(inputDate, 7)),
  lastMonth: formatDate(addDays(inputDate, -30)),
  daysUntilEndOfYear: daysDiff(inputDate, new Date(inputDate.getFullYear(), 11, 31))
};`,
  },
  {
    id: 'js-string-operations',
    name: 'String Operations',
    description: 'Text processing and formatting',
    language: 'javascript',
    category: 'Utilities',
    code: `// String manipulation utilities
const text = input.text || 'Sample text for processing';

// Clean and normalize
const cleaned = text
  .trim()
  .replace(/\\s+/g, ' ')
  .replace(/[^\\w\\s.-]/g, '');

// Extract patterns
const emails = text.match(/[\\w.-]+@[\\w.-]+\\.[a-z]{2,}/gi) || [];
const urls = text.match(/https?:\\/\\/[^\\s]+/gi) || [];
const phones = text.match(/\\+?\\d{1,4}[-.\\s]?\\(?\\d{1,3}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}/g) || [];

// Word analysis
const words = cleaned.toLowerCase().split(' ').filter(w => w.length > 2);
const wordCount = {};
words.forEach(word => {
  wordCount[word] = (wordCount[word] || 0) + 1;
});

// Sort by frequency
const topWords = Object.entries(wordCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([word, count]) => ({ word, count }));

return {
  original: text,
  cleaned,
  wordCount: words.length,
  characterCount: text.length,
  extracted: { emails, urls, phones },
  topWords,
  slug: cleaned.toLowerCase().replace(/\\s+/g, '-')
};`,
  },
  // Python Templates
  {
    id: 'py-data-analysis',
    name: 'Data Analysis',
    description: 'Analyze data with pandas-like operations',
    language: 'python',
    category: 'Data',
    code: `# Data analysis script
import json

data = input.get('items', [])

# Calculate statistics
if data:
    values = [item.get('value', 0) for item in data if isinstance(item.get('value'), (int, float))]
    
    if values:
        stats = {
            'count': len(values),
            'sum': sum(values),
            'mean': sum(values) / len(values),
            'min': min(values),
            'max': max(values),
            'range': max(values) - min(values)
        }
        
        # Standard deviation
        mean = stats['mean']
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        stats['std'] = variance ** 0.5
    else:
        stats = {'error': 'No numeric values found'}
else:
    stats = {'error': 'No data provided'}

# Group by category if available
grouped = {}
for item in data:
    category = item.get('category', 'uncategorized')
    if category not in grouped:
        grouped[category] = []
    grouped[category].append(item)

return {
    'statistics': stats,
    'grouped': {k: len(v) for k, v in grouped.items()},
    'total_items': len(data)
}`,
  },
  {
    id: 'py-web-scraping',
    name: 'Web Scraping Helper',
    description: 'Parse and extract web content',
    language: 'python',
    category: 'Parsing',
    code: `# Web scraping helper functions
import re
import json

html = input.get('html', '')

# Simple HTML parsing (without BeautifulSoup)
def extract_text(html, tag):
    pattern = f'<{tag}[^>]*>(.*?)</{tag}>'
    matches = re.findall(pattern, html, re.DOTALL | re.IGNORECASE)
    return [re.sub('<[^>]+>', '', m).strip() for m in matches]

def extract_links(html):
    pattern = r'<a[^>]+href=["\\'](https?://[^"\\'>]+)["\\'"][^>]*>([^<]*)</a>'
    matches = re.findall(pattern, html, re.IGNORECASE)
    return [{'url': url, 'text': text.strip()} for url, text in matches]

def extract_images(html):
    pattern = r'<img[^>]+src=["\\'](https?://[^"\\'>]+)["\\'"][^>]*(?:alt=["\\'](.*?)[\"\\'"])?'
    matches = re.findall(pattern, html, re.IGNORECASE)
    return [{'src': src, 'alt': alt} for src, alt in matches]

# Extract data
titles = extract_text(html, 'h1') + extract_text(html, 'h2')
paragraphs = extract_text(html, 'p')
links = extract_links(html)
images = extract_images(html)

# Clean text content
text_content = re.sub('<[^>]+>', ' ', html)
text_content = re.sub(r'\\s+', ' ', text_content).strip()

return {
    'titles': titles[:10],
    'paragraphs': paragraphs[:5],
    'links': links[:20],
    'images': images[:10],
    'text_preview': text_content[:500]
}`,
  },
  {
    id: 'py-json-transform',
    name: 'JSON Transform',
    description: 'Transform and restructure JSON data',
    language: 'python',
    category: 'Data',
    code: `# JSON transformation script
import json

data = input.get('data', {})
mapping = input.get('mapping', {})

def transform_value(value, transform_type):
    """Apply transformation to a value"""
    if transform_type == 'uppercase' and isinstance(value, str):
        return value.upper()
    elif transform_type == 'lowercase' and isinstance(value, str):
        return value.lower()
    elif transform_type == 'number' and isinstance(value, str):
        try:
            return float(value)
        except:
            return value
    elif transform_type == 'string':
        return str(value)
    elif transform_type == 'boolean':
        return bool(value)
    return value

def flatten_dict(d, parent_key='', sep='.'):
    """Flatten nested dictionary"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def get_nested(d, path, default=None):
    """Get nested value by dot notation path"""
    keys = path.split('.')
    result = d
    for key in keys:
        if isinstance(result, dict):
            result = result.get(key, default)
        else:
            return default
    return result

# Apply transformations
result = {}
for target_key, source_config in mapping.items():
    if isinstance(source_config, str):
        result[target_key] = get_nested(data, source_config)
    elif isinstance(source_config, dict):
        source_path = source_config.get('path', '')
        transform = source_config.get('transform', None)
        value = get_nested(data, source_path)
        if transform:
            value = transform_value(value, transform)
        result[target_key] = value

# If no mapping provided, return flattened data
if not mapping:
    result = flatten_dict(data) if isinstance(data, dict) else data

return {
    'transformed': result,
    'original_keys': list(data.keys()) if isinstance(data, dict) else [],
    'result_keys': list(result.keys()) if isinstance(result, dict) else []
}`,
  },
];

const LANGUAGE_CONFIG = {
  javascript: {
    name: 'JavaScript',
    icon: '🟨',
    extension: '.js',
    commentPrefix: '//',
    keywords: ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'try', 'catch'],
  },
  typescript: {
    name: 'TypeScript',
    icon: '🔷',
    extension: '.ts',
    commentPrefix: '//',
    keywords: ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'interface', 'type'],
  },
  python: {
    name: 'Python',
    icon: '🐍',
    extension: '.py',
    commentPrefix: '#',
    keywords: ['def', 'async', 'await', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'import', 'from', 'class'],
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const CodeNodeEditor: React.FC<CodeNodeEditorProps> = ({
  node,
  onSave,
  onClose,
  onExecute,
  availableVariables = [],
  position = { x: 100, y: 100 },
}) => {
  // State
  const [language, setLanguage] = useState<'javascript' | 'python' | 'typescript'>(
    node?.language || 'javascript'
  );
  const [code, setCode] = useState(node?.data.code || getDefaultCode('javascript'));
  const [nodeName, setNodeName] = useState(node?.data.label || 'Code Node');
  const [description, setDescription] = useState(node?.data.description || '');
  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'variables' | 'output'>('editor');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMappings, _setInputMappings] = useState<Record<string, string>>(
    node?.data.inputMapping || {}
  );
  const [outputMappings, _setOutputMappings] = useState<Record<string, string>>(
    node?.data.outputMapping || {}
  );
  const [timeout, setTimeout] = useState(node?.data.timeout || 30000);
  const [packages, setPackages] = useState<string[]>(node?.data.packages || []);
  const [newPackage, setNewPackage] = useState('');

  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  // Get default code for language
  function getDefaultCode(lang: 'javascript' | 'python' | 'typescript'): string {
    switch (lang) {
      case 'javascript':
        return `// Your JavaScript code here
// Input data is available via the 'input' variable

const result = {
  message: 'Hello from JavaScript!',
  timestamp: new Date().toISOString(),
  inputReceived: input
};

return result;`;
      case 'typescript':
        return `// Your TypeScript code here
// Input data is available via the 'input' variable

interface Result {
  message: string;
  timestamp: string;
  inputReceived: unknown;
}

const result: Result = {
  message: 'Hello from TypeScript!',
  timestamp: new Date().toISOString(),
  inputReceived: input
};

return result;`;
      case 'python':
        return `# Your Python code here
# Input data is available via the 'input' variable

result = {
    'message': 'Hello from Python!',
    'timestamp': __import__('datetime').datetime.now().isoformat(),
    'input_received': input
}

return result`;
      default:
        return '';
    }
  }

  // Handle language change
  const handleLanguageChange = useCallback((newLang: 'javascript' | 'python' | 'typescript') => {
    if (newLang !== language) {
      const confirmChange = code === getDefaultCode(language) || 
        window.confirm('Changing language will reset the code. Continue?');
      if (confirmChange) {
        setLanguage(newLang);
        setCode(getDefaultCode(newLang));
      }
    }
  }, [language, code]);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: CodeTemplate) => {
    setLanguage(template.language);
    setCode(template.code);
    setNodeName(template.name);
    setDescription(template.description);
    setShowTemplates(false);
    setActiveTab('editor');
  }, []);

  // Handle code execution
  const handleExecute = useCallback(async () => {
    if (!onExecute) return;
    
    setIsExecuting(true);
    setActiveTab('output');
    
    try {
      const result = await onExecute(code, language);
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        output: null,
        logs: [],
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExecuting(false);
    }
  }, [code, language, onExecute]);

  // Handle save
  const handleSave = useCallback(() => {
    const codeNode: CodeNode = {
      id: node?.id || `code-${Date.now()}`,
      type: 'code',
      language,
      position: node?.position || position,
      data: {
        label: nodeName,
        description,
        code,
        language,
        inputMapping: inputMappings,
        outputMapping: outputMappings,
        timeout,
        sandbox: true,
        packages,
        status: 'idle',
      },
    };
    onSave(codeNode);
    onClose();
  }, [node, nodeName, description, code, language, inputMappings, outputMappings, timeout, packages, position, onSave, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleExecute]);

  // Filter templates
  const filteredTemplates = CODE_TEMPLATES.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      t.language === language &&
      (t.name.toLowerCase().includes(query) ||
       t.description.toLowerCase().includes(query) ||
       t.category.toLowerCase().includes(query))
    );
  });

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, CodeTemplate[]>);

  // Add package
  const handleAddPackage = useCallback(() => {
    if (newPackage && !packages.includes(newPackage)) {
      setPackages([...packages, newPackage]);
      setNewPackage('');
    }
  }, [newPackage, packages]);

  // Remove package
  const handleRemovePackage = useCallback((pkg: string) => {
    setPackages(packages.filter(p => p !== pkg));
  }, [packages]);

  return (
    <div className="code-node-editor">
      <div className="editor-header">
        <div className="header-left">
          <h3>{node ? 'Edit' : 'Add'} Code Node</h3>
        </div>
        <div className="header-right">
          <div className="language-selector">
            {Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => (
              <button
                key={lang}
                className={`lang-btn ${language === lang ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lang as 'javascript' | 'python' | 'typescript')}
                title={config.name}
              >
                <span className="lang-icon">{config.icon}</span>
                <span className="lang-name">{config.name}</span>
              </button>
            ))}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="editor-toolbar">
        <div className="toolbar-left">
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            placeholder="Node name"
            className="node-name-input"
          />
        </div>
        <div className="toolbar-right">
          <button
            className="toolbar-btn"
            onClick={() => setShowTemplates(!showTemplates)}
            title="Browse templates"
          >
            📋 Templates
          </button>
          {onExecute && (
            <button
              className="toolbar-btn execute"
              onClick={handleExecute}
              disabled={isExecuting}
              title="Run code (⌘+Enter)"
            >
              {isExecuting ? '⏳ Running...' : '▶️ Run'}
            </button>
          )}
        </div>
      </div>

      <div className="editor-tabs">
        <button
          className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          Code Editor
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button
          className={`tab ${activeTab === 'variables' ? 'active' : ''}`}
          onClick={() => setActiveTab('variables')}
        >
          Variables
        </button>
        <button
          className={`tab ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          Output {executionResult && (executionResult.success ? '✓' : '✗')}
        </button>
      </div>

      <div className="editor-content">
        {activeTab === 'editor' && (
          <div className="code-editor-container">
            <div className="line-numbers">
              {code.split('\n').map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <textarea
              ref={codeEditorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="code-textarea"
              spellCheck={false}
              placeholder="Write your code here..."
            />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-panel">
            <div className="search-box">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
              />
            </div>
            
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category} className="template-category">
                <h4>{category}</h4>
                <div className="template-list">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      className="template-item"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <span className="template-name">{template.name}</span>
                      <span className="template-desc">{template.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            {Object.keys(groupedTemplates).length === 0 && (
              <div className="no-templates">
                No templates found for {LANGUAGE_CONFIG[language].name}
              </div>
            )}
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="variables-panel">
            <div className="variables-section">
              <h4>Available Input Variables</h4>
              <p className="hint">These variables are available in your code via the &apos;input&apos; object</p>
              
              {availableVariables.length === 0 ? (
                <p className="no-vars">No variables available from previous nodes</p>
              ) : (
                <div className="variables-list">
                  {availableVariables.map(v => (
                    <div key={v.name} className="variable-item">
                      <span className="var-name">{v.name}</span>
                      <span className="var-type">{v.type}</span>
                      <code className="var-usage">input.{v.name}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="variables-section">
              <h4>Packages / Dependencies</h4>
              <p className="hint">Add npm/pip packages to use in your code</p>
              
              <div className="package-input">
                <input
                  type="text"
                  value={newPackage}
                  onChange={(e) => setNewPackage(e.target.value)}
                  placeholder={language === 'python' ? 'e.g., requests' : 'e.g., lodash'}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPackage()}
                />
                <button onClick={handleAddPackage}>Add</button>
              </div>
              
              <div className="packages-list">
                {packages.map(pkg => (
                  <span key={pkg} className="package-tag">
                    {pkg}
                    <button onClick={() => handleRemovePackage(pkg)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="variables-section">
              <h4>Execution Settings</h4>
              
              <div className="setting-field">
                <label>Timeout (ms)</label>
                <input
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(parseInt(e.target.value, 10))}
                  min={1000}
                  max={300000}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="output-panel">
            {isExecuting ? (
              <div className="executing">
                <div className="spinner" />
                <p>Executing code...</p>
              </div>
            ) : executionResult ? (
              <>
                <div className={`execution-status ${executionResult.success ? 'success' : 'error'}`}>
                  <span className="status-icon">
                    {executionResult.success ? '✓' : '✗'}
                  </span>
                  <span className="status-text">
                    {executionResult.success ? 'Execution successful' : 'Execution failed'}
                  </span>
                  <span className="execution-time">
                    {executionResult.executionTime}ms
                  </span>
                </div>

                {executionResult.error && (
                  <div className="error-output">
                    <h4>Error</h4>
                    <pre>{executionResult.error}</pre>
                  </div>
                )}

                {executionResult.logs.length > 0 && (
                  <div className="logs-output">
                    <h4>Console Output</h4>
                    <pre>{executionResult.logs.join('\n')}</pre>
                  </div>
                )}

                <div className="result-output">
                  <h4>Return Value</h4>
                  <pre>
                    {typeof executionResult.output === 'object'
                      ? JSON.stringify(executionResult.output, null, 2)
                      : String(executionResult.output)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="no-output">
                <p>No output yet. Click &quot;Run&quot; to execute the code.</p>
                <p className="shortcut">Keyboard shortcut: ⌘+Enter</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="editor-footer">
        <div className="footer-left">
          <span className="char-count">{code.length} characters</span>
          <span className="line-count">{code.split('\n').length} lines</span>
        </div>
        <div className="footer-right">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save Node
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeNodeEditor;
