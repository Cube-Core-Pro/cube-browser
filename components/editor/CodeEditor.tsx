'use client';

/**
 * CodeEditor Component
 * CUBE Elite v7 - Professional Code Editor using Monaco
 * 
 * Full-featured code editor with syntax highlighting, intellisense,
 * and multi-language support for automation workflows.
 */

import React, { useCallback, useRef } from 'react';
import Editor, { OnMount, OnChange, Monaco } from '@monaco-editor/react';
import type { editor, Position, IRange, Uri } from 'monaco-editor';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('CodeEditor');

// =============================================================================
// Types
// =============================================================================

export type SupportedLanguage = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'json' 
  | 'html' 
  | 'css' 
  | 'sql'
  | 'markdown'
  | 'yaml'
  | 'shell';

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: SupportedLanguage;
  theme?: 'vs-dark' | 'light' | 'hc-black';
  height?: string | number;
  readOnly?: boolean;
  minimap?: boolean;
  lineNumbers?: boolean;
  wordWrap?: boolean;
  fontSize?: number;
  tabSize?: number;
  placeholder?: string;
  className?: string;
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
  onValidate?: (markers: editor.IMarker[]) => void;
}

// =============================================================================
// Language Configurations
// =============================================================================

const LANGUAGE_CONFIGS: Record<SupportedLanguage, { label: string; extensions: string[] }> = {
  javascript: { label: 'JavaScript', extensions: ['.js', '.mjs'] },
  typescript: { label: 'TypeScript', extensions: ['.ts', '.tsx'] },
  python: { label: 'Python', extensions: ['.py'] },
  json: { label: 'JSON', extensions: ['.json'] },
  html: { label: 'HTML', extensions: ['.html', '.htm'] },
  css: { label: 'CSS', extensions: ['.css', '.scss'] },
  sql: { label: 'SQL', extensions: ['.sql'] },
  markdown: { label: 'Markdown', extensions: ['.md'] },
  yaml: { label: 'YAML', extensions: ['.yaml', '.yml'] },
  shell: { label: 'Shell', extensions: ['.sh', '.bash'] },
};

// =============================================================================
// Monaco Theme Configuration
// =============================================================================

const defineCustomThemes = (monaco: Monaco) => {
  // CUBE Dark Theme
  monaco.editor.defineTheme('cube-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c084fc' },
      { token: 'string', foreground: '4ade80' },
      { token: 'number', foreground: 'fbbf24' },
      { token: 'type', foreground: '60a5fa' },
      { token: 'function', foreground: '818cf8' },
      { token: 'variable', foreground: 'f8fafc' },
      { token: 'operator', foreground: 'f472b6' },
    ],
    colors: {
      'editor.background': '#0f172a',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#1e293b',
      'editor.selectionBackground': '#334155',
      'editorCursor.foreground': '#8b5cf6',
      'editorWhitespace.foreground': '#334155',
      'editorIndentGuide.background': '#1e293b',
      'editorIndentGuide.activeBackground': '#334155',
      'editor.selectionHighlightBackground': '#475569',
      'editorBracketMatch.background': '#475569',
      'editorBracketMatch.border': '#8b5cf6',
    },
  });

  // CUBE Light Theme
  monaco.editor.defineTheme('cube-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7c3aed' },
      { token: 'string', foreground: '16a34a' },
      { token: 'number', foreground: 'd97706' },
      { token: 'type', foreground: '2563eb' },
      { token: 'function', foreground: '4f46e5' },
      { token: 'variable', foreground: '1f2937' },
      { token: 'operator', foreground: 'db2777' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1f2937',
      'editor.lineHighlightBackground': '#f3f4f6',
      'editor.selectionBackground': '#c7d2fe',
      'editorCursor.foreground': '#8b5cf6',
      'editorWhitespace.foreground': '#e5e7eb',
      'editorIndentGuide.background': '#f3f4f6',
      'editorIndentGuide.activeBackground': '#e5e7eb',
    },
  });
};

// =============================================================================
// Code Snippets
// =============================================================================

const registerSnippets = (monaco: Monaco) => {
  // JavaScript/TypeScript snippets for automation
  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: (model: editor.ITextModel, position: Position) => {
      const word = model.getWordUntilPosition(position);
      const range: IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: [
          {
            label: 'transform',
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: 'Transform data items',
            insertText: [
              '// Transform data',
              'return items.map(item => ({',
              '\t...item.json,',
              '\t${1:processed}: true',
              '}));',
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          },
          {
            label: 'filter',
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: 'Filter data items',
            insertText: [
              '// Filter items',
              'return items.filter(item =>',
              '\titem.json.${1:status} === "${2:active}"',
              ');',
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          },
          {
            label: 'fetch',
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: 'Make HTTP request',
            insertText: [
              '// Make HTTP request',
              'const response = await fetch("${1:https://api.example.com/data}");',
              'const data = await response.json();',
              'return [{ json: data }];',
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          },
          {
            label: 'aggregate',
            kind: monaco.languages.CompletionItemKind.Snippet,
            documentation: 'Aggregate data',
            insertText: [
              '// Aggregate data',
              'const total = items.reduce((sum, item) =>',
              '\tsum + item.json.${1:amount}, 0',
              ');',
              'return [{ json: { total } }];',
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          },
        ],
      };
    },
  });
};

// =============================================================================
// Main Component
// =============================================================================

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  theme,
  height = 300,
  readOnly = false,
  minimap = false,
  lineNumbers = true,
  wordWrap = true,
  fontSize = 14,
  tabSize = 2,
  placeholder,
  className = '',
  onMount,
  onValidate,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // Determine theme based on system preference if not specified
  const resolvedTheme = theme || 
    (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'cube-dark' 
      : 'cube-light');

  // Handle editor mount
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    log.debug(`CodeEditor mounted with language: ${language}`);
    
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom themes
    defineCustomThemes(monaco);
    
    // Register snippets
    registerSnippets(monaco);

    // Set theme
    monaco.editor.setTheme(resolvedTheme);

    // Set validation callback
    if (onValidate) {
      monaco.editor.onDidChangeMarkers((uris: readonly Uri[]) => {
        const editorUri = editor.getModel()?.uri;
        if (editorUri && uris.some(uri => uri.toString() === editorUri.toString())) {
          const markers = monaco.editor.getModelMarkers({ resource: editorUri });
          onValidate(markers);
        }
      });
    }

    // Call user's onMount callback
    if (onMount) {
      onMount(editor, monaco);
    }

    // Focus editor
    editor.focus();
  }, [language, resolvedTheme, onMount, onValidate]);

  // Handle value change
  const handleChange: OnChange = useCallback((newValue) => {
    if (onChange && newValue !== undefined) {
      onChange(newValue);
    }
  }, [onChange]);

  // Editor options
  const options: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    minimap: { enabled: minimap },
    lineNumbers: lineNumbers ? 'on' : 'off',
    wordWrap: wordWrap ? 'on' : 'off',
    fontSize,
    tabSize,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: 'all',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    folding: true,
    foldingHighlight: true,
    showFoldingControls: 'mouseover',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showClasses: true,
      showFunctions: true,
      showVariables: true,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
  };

  return (
    <div className={`code-editor-wrapper rounded-lg overflow-hidden border border-border ${className}`}>
      {placeholder && !value && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        </div>
      )}
      <Editor
        height={height}
        language={language}
        value={value}
        theme={resolvedTheme}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={options}
        loading={
          <div className="flex items-center justify-center h-full bg-muted/50">
            <div className="animate-pulse text-muted-foreground">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get language configuration
 */
export const getLanguageConfig = (language: SupportedLanguage) => {
  return LANGUAGE_CONFIGS[language];
};

/**
 * Detect language from file extension
 */
export const detectLanguage = (filename: string): SupportedLanguage => {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  
  for (const [lang, config] of Object.entries(LANGUAGE_CONFIGS)) {
    if (config.extensions.includes(ext)) {
      return lang as SupportedLanguage;
    }
  }
  
  return 'javascript'; // Default
};

// =============================================================================
// Export
// =============================================================================

export default CodeEditor;
