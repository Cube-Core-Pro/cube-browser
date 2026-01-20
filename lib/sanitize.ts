/**
 * CUBE Nexum - HTML Sanitization Utilities
 * 
 * Provides secure HTML sanitization to prevent XSS attacks
 * when rendering user-generated or AI-generated content.
 */

/**
 * List of allowed HTML tags for sanitization
 */
const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'img'
]);

/**
 * Allowed attributes per tag
 */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  'a': new Set(['href', 'title', 'target', 'rel']),
  'img': new Set(['src', 'alt', 'title', 'width', 'height']),
  'span': new Set(['class']),
  'div': new Set(['class']),
  'code': new Set(['class']),
  'pre': new Set(['class']),
  '*': new Set(['class']) // Global allowed attributes
};

/**
 * Protocols allowed in href/src attributes
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return text.replace(/[&<>"'/]/g, char => escapeMap[char] || char);
}

/**
 * Check if a URL is safe (uses allowed protocol)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://example.com');
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * This is a lightweight sanitizer. For production use with complex HTML,
 * consider using DOMPurify library.
 * 
 * @param html - The HTML string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(
  html: string,
  options: {
    allowedTags?: string[];
    stripAllTags?: boolean;
  } = {}
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // If strip all tags, just escape everything
  if (options.stripAllTags) {
    return escapeHtml(html);
  }

  const customAllowedTags = options.allowedTags 
    ? new Set(options.allowedTags.map(t => t.toLowerCase()))
    : ALLOWED_TAGS;

  // Create a temporary DOM parser
  if (typeof DOMParser === 'undefined') {
    // Server-side: strip all tags
    return html.replace(/<[^>]*>/g, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Recursively sanitize nodes
  const sanitizeNode = (node: Node): void => {
    const children = Array.from(node.childNodes);
    
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const tagName = element.tagName.toLowerCase();
        
        // Remove disallowed tags
        if (!customAllowedTags.has(tagName)) {
          // Replace with text content
          const text = document.createTextNode(element.textContent || '');
          node.replaceChild(text, child);
          continue;
        }
        
        // Sanitize attributes
        const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || new Set();
        const globalAttrs = ALLOWED_ATTRIBUTES['*'] || new Set();
        const attrs = Array.from(element.attributes);
        
        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();
          
          // Remove event handlers
          if (attrName.startsWith('on')) {
            element.removeAttribute(attr.name);
            continue;
          }
          
          // Check if attribute is allowed
          if (!allowedAttrs.has(attrName) && !globalAttrs.has(attrName)) {
            element.removeAttribute(attr.name);
            continue;
          }
          
          // Validate URLs in href and src
          if (attrName === 'href' || attrName === 'src') {
            if (!isSafeUrl(attr.value)) {
              element.removeAttribute(attr.name);
            }
          }
          
          // Force safe link attributes
          if (tagName === 'a') {
            element.setAttribute('rel', 'noopener noreferrer');
            element.setAttribute('target', '_blank');
          }
        }
        
        // Recursively sanitize children
        sanitizeNode(child);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        // Remove comments
        node.removeChild(child);
      }
    }
  };
  
  sanitizeNode(doc.body);
  
  return doc.body.innerHTML;
}

/**
 * Convert markdown-like text to safe HTML
 * Safer alternative to regex-based conversion
 */
export function markdownToSafeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // First escape all HTML
  let html = escapeHtml(text);
  
  // Then apply safe markdown transformations
  html = html
    // Headers (must be at start of line)
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Lists (simple)
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br/>');
  
  // Wrap in paragraph if needed
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }
  
  return html;
}

/**
 * Parse ANSI escape codes to safe HTML
 * Used for terminal output rendering
 */
export function ansiToSafeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // First escape HTML special characters
  let html = escapeHtml(text);
  
  // Define safe ANSI to class mappings
  const ansiMap: Record<string, string> = {
    '\x1b[30m': '<span class="text-black">',
    '\x1b[31m': '<span class="text-red-400">',
    '\x1b[32m': '<span class="text-green-400">',
    '\x1b[33m': '<span class="text-yellow-400">',
    '\x1b[34m': '<span class="text-blue-400">',
    '\x1b[35m': '<span class="text-purple-400">',
    '\x1b[36m': '<span class="text-cyan-400">',
    '\x1b[37m': '<span class="text-white">',
    '\x1b[0m': '</span>',
    '\x1b[1m': '<span class="font-bold">',
    '\x1b[4m': '<span class="underline">'
  };
  
  // Replace ANSI codes with safe spans
  for (const [ansi, replacement] of Object.entries(ansiMap)) {
    html = html.split(ansi).join(replacement);
  }
  
  // Remove any remaining ANSI codes
  html = html.replace(/\x1b\[[0-9;]*m/g, '');
  
  return html;
}

/**
 * Validate and sanitize a URL for safe usage
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    // Try to fix relative URLs
    if (url.startsWith('/') || url.startsWith('./')) {
      return url;
    }
    
    // Try adding https://
    try {
      const withProtocol = new URL(`https://${url}`);
      return withProtocol.toString();
    } catch {
      return null;
    }
  }
}

const sanitizeUtils = {
  escapeHtml,
  sanitizeHtml,
  markdownToSafeHtml,
  ansiToSafeHtml,
  sanitizeUrl,
  isSafeUrl
};

export default sanitizeUtils;
