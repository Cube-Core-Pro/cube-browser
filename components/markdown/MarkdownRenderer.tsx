'use client';

/**
 * MarkdownRenderer Component
 * CUBE Elite v7 - Professional Markdown Rendering
 * 
 * Uses react-markdown with remark-gfm for full GitHub Flavored Markdown
 * support including tables, task lists, strikethrough, and more.
 */

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('MarkdownRenderer');

// =============================================================================
// Types
// =============================================================================

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  allowHtml?: boolean;
  linkTarget?: '_blank' | '_self';
  maxHeight?: string | number;
  codeTheme?: 'dark' | 'light';
}

// =============================================================================
// Custom Components
// =============================================================================

const createComponents = (linkTarget: '_blank' | '_self', codeTheme: 'dark' | 'light'): Components => ({
  // Headers
  h1: ({ children, ...props }) => (
    <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-foreground" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-xl font-semibold mb-3 mt-5 text-foreground" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-medium mb-2 mt-4 text-foreground" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-base font-medium mb-2 mt-3 text-foreground" {...props}>
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children, ...props }) => (
    <p className="mb-4 leading-relaxed text-foreground/90" {...props}>
      {children}
    </p>
  ),

  // Links
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target={linkTarget}
      rel={linkTarget === '_blank' ? 'noopener noreferrer' : undefined}
      className="text-primary hover:underline font-medium"
      {...props}
    >
      {children}
    </a>
  ),

  // Lists
  ul: ({ children, ...props }) => (
    <ul className="mb-4 ml-6 list-disc space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-foreground/90" {...props}>
      {children}
    </li>
  ),

  // Blockquote
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-muted/50 rounded-r-lg italic text-foreground/80"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Code
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    
    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-sm"
          {...props}
        >
          {children}
        </code>
      );
    }

    // Extract language from className (e.g., "language-javascript")
    const language = className?.replace('language-', '') || '';

    return (
      <code
        className={cn(
          "block p-4 rounded-lg font-mono text-sm overflow-x-auto",
          codeTheme === 'dark' 
            ? "bg-slate-900 text-slate-100" 
            : "bg-slate-100 text-slate-900"
        )}
        data-language={language}
        {...props}
      >
        {children}
      </code>
    );
  },

  // Pre (code block wrapper)
  pre: ({ children, ...props }) => (
    <pre className="mb-4 rounded-lg overflow-hidden" {...props}>
      {children}
    </pre>
  ),

  // Tables (GFM)
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/50" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-border" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-muted/30 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-3 text-left font-semibold text-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-foreground/90" {...props}>
      {children}
    </td>
  ),

  // Horizontal Rule
  hr: (props) => (
    <hr className="my-6 border-border" {...props} />
  ),

  // Strong & Emphasis
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // Strikethrough (GFM)
  del: ({ children, ...props }) => (
    <del className="line-through text-muted-foreground" {...props}>
      {children}
    </del>
  ),

  // Images
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt || ''}
      className="max-w-full h-auto rounded-lg my-4 shadow-sm"
      loading="lazy"
      {...props}
    />
  ),

  // Task Lists (GFM) - rendered as li with checkbox styling
  input: ({ type, checked, ...props }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled
          className="mr-2 h-4 w-4 rounded border-muted-foreground/50"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  },
});

// =============================================================================
// Main Component
// =============================================================================

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  allowHtml = false,
  linkTarget = '_blank',
  maxHeight,
  codeTheme = 'dark',
}) => {
  log.debug(`Rendering markdown content (${content.length} chars)`);

  // Memoize components configuration
  const components = useMemo(
    () => createComponents(linkTarget, codeTheme),
    [linkTarget, codeTheme]
  );

  // Container styles
  const containerStyle = maxHeight 
    ? { maxHeight, overflowY: 'auto' as const }
    : undefined;

  return (
    <div
      className={cn('markdown-content prose prose-slate dark:prose-invert max-w-none', className)}
      style={containerStyle}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        skipHtml={!allowHtml}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// =============================================================================
// AI Response Renderer
// =============================================================================

interface AIResponseRendererProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export const AIResponseRenderer: React.FC<AIResponseRendererProps> = ({
  content,
  isStreaming = false,
  className = '',
}) => {
  return (
    <div className={cn('ai-response', className)}>
      <MarkdownRenderer
        content={content}
        codeTheme="dark"
        linkTarget="_blank"
      />
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
      )}
    </div>
  );
};

// =============================================================================
// Export
// =============================================================================

export default MarkdownRenderer;
