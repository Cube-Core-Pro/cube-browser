/**
 * Self-Healing Selectors Service - Intelligent Selector Management
 *
 * Provides AI-powered selector healing, alternative selector generation,
 * and selector validation for robust web automation.
 *
 * M5 Features:
 * - Automatic selector healing when elements change
 * - Multiple selector strategies (CSS, XPath, text, attributes)
 * - Selector confidence scoring
 * - Visual element fingerprinting
 * - Historical selector tracking
 * - AI-powered selector suggestions
 *
 * @module SelfHealingSelectorsService
 * @version 1.0.0
 * @date 2025-12-25
 */

import { invoke } from '@tauri-apps/api/core';
import { TelemetryService, SpanKind } from './telemetry-service';

// ============================================================================
// Types
// ============================================================================

export interface ElementSelector {
  /**
   * Unique identifier for this selector
   */
  id: string;

  /**
   * Human-readable name for the selector
   */
  name: string;

  /**
   * Primary selector string
   */
  primary: string;

  /**
   * Selector type
   */
  type: SelectorType;

  /**
   * Alternative selectors ranked by preference
   */
  alternatives: AlternativeSelector[];

  /**
   * Visual fingerprint of the element
   */
  fingerprint?: ElementFingerprint;

  /**
   * Last successful match timestamp
   */
  lastMatch?: number;

  /**
   * Number of times this selector has healed
   */
  healCount: number;

  /**
   * Confidence score (0-100)
   */
  confidence: number;

  /**
   * Associated page URL pattern
   */
  pagePattern?: string;

  /**
   * Metadata
   */
  metadata?: Record<string, unknown>;
}

export type SelectorType =
  | 'css'
  | 'xpath'
  | 'text'
  | 'id'
  | 'name'
  | 'class'
  | 'data-attribute'
  | 'aria'
  | 'link-text'
  | 'partial-link-text';

export interface AlternativeSelector {
  /**
   * Selector string
   */
  selector: string;

  /**
   * Selector type
   */
  type: SelectorType;

  /**
   * Confidence score (0-100)
   */
  confidence: number;

  /**
   * Strategy used to generate this alternative
   */
  strategy: SelectorStrategy;

  /**
   * Last time this selector was successfully used
   */
  lastSuccess?: number;

  /**
   * Number of times this selector has worked
   */
  successCount: number;

  /**
   * Number of times this selector has failed
   */
  failCount: number;
}

export type SelectorStrategy =
  | 'id-based'
  | 'class-based'
  | 'attribute-based'
  | 'xpath-position'
  | 'xpath-text'
  | 'xpath-relative'
  | 'css-descendant'
  | 'css-sibling'
  | 'css-nth-child'
  | 'aria-label'
  | 'aria-role'
  | 'data-testid'
  | 'text-content'
  | 'visual-similarity'
  | 'ai-generated';

export interface ElementFingerprint {
  /**
   * Tag name
   */
  tagName: string;

  /**
   * Element text content (truncated)
   */
  textContent?: string;

  /**
   * Key attributes
   */
  attributes: Record<string, string>;

  /**
   * Bounding box relative to viewport
   */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /**
   * Computed styles relevant for identification
   */
  computedStyles?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: string;
    fontFamily?: string;
  };

  /**
   * DOM path from root
   */
  domPath: string[];

  /**
   * Visual hash for similarity comparison
   */
  visualHash?: string;

  /**
   * Screenshot of element (base64)
   */
  screenshot?: string;
}

export interface SelectorHealResult {
  /**
   * Whether healing was successful
   */
  success: boolean;

  /**
   * Original selector that failed
   */
  originalSelector: string;

  /**
   * New healed selector
   */
  healedSelector?: string;

  /**
   * Type of the healed selector
   */
  healedType?: SelectorType;

  /**
   * Confidence in the healed selector
   */
  confidence: number;

  /**
   * Strategy used for healing
   */
  strategy?: SelectorStrategy;

  /**
   * Alternatives considered
   */
  alternativesConsidered: number;

  /**
   * Time taken for healing (ms)
   */
  healingTime: number;

  /**
   * Reason for failure if unsuccessful
   */
  failureReason?: string;
}

export interface SelectorAnalysis {
  /**
   * Original selector
   */
  selector: string;

  /**
   * Is selector valid
   */
  isValid: boolean;

  /**
   * Selector type detected
   */
  type: SelectorType;

  /**
   * Complexity score (higher = more fragile)
   */
  complexity: number;

  /**
   * Maintainability score (0-100)
   */
  maintainability: number;

  /**
   * Suggested improvements
   */
  suggestions: SelectorSuggestion[];

  /**
   * Potential issues
   */
  issues: SelectorIssue[];

  /**
   * Alternative selectors ranked by quality
   */
  alternatives: AlternativeSelector[];
}

export interface SelectorSuggestion {
  /**
   * Suggested selector
   */
  selector: string;

  /**
   * Type of selector
   */
  type: SelectorType;

  /**
   * Why this is suggested
   */
  reason: string;

  /**
   * Improvement score
   */
  improvement: number;
}

export interface SelectorIssue {
  /**
   * Issue severity
   */
  severity: 'warning' | 'error' | 'info';

  /**
   * Issue code
   */
  code: string;

  /**
   * Human-readable message
   */
  message: string;

  /**
   * Suggested fix
   */
  fix?: string;
}

export interface SelectorHistory {
  /**
   * Selector ID
   */
  selectorId: string;

  /**
   * Historical events
   */
  events: SelectorEvent[];

  /**
   * Success rate over time
   */
  successRate: number;

  /**
   * Total heal count
   */
  totalHeals: number;

  /**
   * Average confidence
   */
  averageConfidence: number;
}

export interface SelectorEvent {
  /**
   * Event timestamp
   */
  timestamp: number;

  /**
   * Event type
   */
  type: 'match' | 'fail' | 'heal' | 'update' | 'create';

  /**
   * Selector used
   */
  selector: string;

  /**
   * Page URL
   */
  pageUrl: string;

  /**
   * Additional details
   */
  details?: Record<string, unknown>;
}

export interface SelectorValidationResult {
  /**
   * Whether selector is valid
   */
  isValid: boolean;

  /**
   * Number of matching elements
   */
  matchCount: number;

  /**
   * Whether selector is unique (matches exactly one element)
   */
  isUnique: boolean;

  /**
   * Matched elements info
   */
  matches: ElementInfo[];

  /**
   * Validation errors
   */
  errors: string[];
}

export interface ElementInfo {
  /**
   * Tag name
   */
  tagName: string;

  /**
   * Element ID if present
   */
  id?: string;

  /**
   * Classes
   */
  classes: string[];

  /**
   * Text content preview
   */
  textPreview?: string;

  /**
   * Is element visible
   */
  isVisible: boolean;

  /**
   * Is element interactable
   */
  isInteractable: boolean;
}

// ============================================================================
// Self-Healing Selectors Service
// ============================================================================

export const SelfHealingSelectorsService = {
  /**
   * Analyze a selector and get quality metrics
   */
  analyzeSelector: async (
    selector: string,
    pageUrl?: string
  ): Promise<SelectorAnalysis> => {
    const spanId = TelemetryService.startSpan('selfhealing.analyzeSelector', {
      kind: SpanKind.CLIENT,
      attributes: {
        'selector.original': selector.substring(0, 100),
        'page.url': pageUrl || 'unknown',
      },
    });

    try {
      const result = await invoke<SelectorAnalysis>('automation_analyze_selector', {
        selector,
        pageUrl,
      });
      TelemetryService.endSpan(spanId, { code: 1 }); // OK
      return result;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) }); // ERROR
      throw error;
    }
  },

  /**
   * Validate a selector against the current page
   */
  validateSelector: async (
    selector: string,
    type?: SelectorType
  ): Promise<SelectorValidationResult> => {
    const spanId = TelemetryService.startSpan('selfhealing.validateSelector', {
      kind: SpanKind.CLIENT,
    });

    try {
      const result = await invoke<SelectorValidationResult>(
        'automation_validate_selector',
        { selector, selectorType: type }
      );
      TelemetryService.endSpan(spanId);
      return result;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Heal a broken selector by finding a working alternative
   */
  healSelector: async (
    selector: ElementSelector,
    pageUrl: string
  ): Promise<SelectorHealResult> => {
    const spanId = TelemetryService.startSpan('selfhealing.healSelector', {
      kind: SpanKind.CLIENT,
      attributes: {
        'selector.id': selector.id,
        'selector.healCount': selector.healCount,
      },
    });

    try {
      const _startTime = performance.now();
      const result = await invoke<SelectorHealResult>('automation_heal_selector', {
        selector,
        pageUrl,
      });

      TelemetryService.recordMetric('selfhealing.healTime', result.healingTime, 'ms');
      TelemetryService.recordMetric(
        'selfhealing.confidence',
        result.confidence,
        'percent'
      );

      if (result.success) {
        TelemetryService.trackEvent('selector_healed', {
          selectorId: selector.id,
          strategy: result.strategy || 'unknown',
          confidence: result.confidence,
        });
      }

      TelemetryService.endSpan(spanId);
      return result;
    } catch (error) {
      TelemetryService.trackError(error instanceof Error ? error : String(error), {
        context: { action: 'healSelector', extra: { selectorId: selector.id } },
      });
      TelemetryService.endSpan(spanId, { code: 2, message: String(error) });
      throw error;
    }
  },

  /**
   * Generate alternative selectors for an element
   */
  generateAlternatives: async (
    selector: string,
    pageUrl: string,
    maxAlternatives?: number
  ): Promise<AlternativeSelector[]> => {
    const spanId = TelemetryService.startSpan('selfhealing.generateAlternatives', {
      kind: SpanKind.CLIENT,
    });

    try {
      const result = await invoke<AlternativeSelector[]>(
        'automation_generate_selector_alternatives',
        { selector, pageUrl, maxAlternatives: maxAlternatives || 10 }
      );
      TelemetryService.endSpan(spanId);
      return result;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2 });
      throw error;
    }
  },

  /**
   * Create element fingerprint for future matching
   */
  createFingerprint: async (
    selector: string,
    pageUrl: string
  ): Promise<ElementFingerprint> => {
    return invoke<ElementFingerprint>('automation_create_element_fingerprint', {
      selector,
      pageUrl,
    });
  },

  /**
   * Find element by fingerprint (visual similarity)
   */
  findByFingerprint: async (
    fingerprint: ElementFingerprint,
    pageUrl: string
  ): Promise<SelectorHealResult> => {
    return invoke<SelectorHealResult>('automation_find_by_fingerprint', {
      fingerprint,
      pageUrl,
    });
  },

  /**
   * Save a selector with its alternatives
   */
  saveSelector: async (selector: ElementSelector): Promise<void> => {
    return invoke('automation_save_selector', { selector });
  },

  /**
   * Get saved selector by ID
   */
  getSelector: async (selectorId: string): Promise<ElementSelector | null> => {
    return invoke<ElementSelector | null>('automation_get_selector', {
      selectorId,
    });
  },

  /**
   * Get all saved selectors
   */
  getAllSelectors: async (): Promise<ElementSelector[]> => {
    return invoke<ElementSelector[]>('automation_get_all_selectors');
  },

  /**
   * Delete a selector
   */
  deleteSelector: async (selectorId: string): Promise<void> => {
    return invoke('automation_delete_selector', { selectorId });
  },

  /**
   * Get selector history
   */
  getSelectorHistory: async (selectorId: string): Promise<SelectorHistory> => {
    return invoke<SelectorHistory>('automation_get_selector_history', {
      selectorId,
    });
  },

  /**
   * Use AI to generate optimal selector
   */
  aiGenerateSelector: async (
    elementDescription: string,
    pageUrl: string,
    pageHtml?: string
  ): Promise<AlternativeSelector[]> => {
    const spanId = TelemetryService.startSpan('selfhealing.aiGenerate', {
      kind: SpanKind.CLIENT,
    });

    try {
      const result = await invoke<AlternativeSelector[]>(
        'automation_ai_generate_selector',
        {
          elementDescription,
          pageUrl,
          pageHtml: pageHtml?.substring(0, 50000), // Limit HTML size
        }
      );
      TelemetryService.endSpan(spanId);
      return result;
    } catch (error) {
      TelemetryService.endSpan(spanId, { code: 2 });
      throw error;
    }
  },

  /**
   * Use AI to explain why a selector might be failing
   */
  aiExplainFailure: async (
    selector: string,
    pageUrl: string,
    errorMessage: string
  ): Promise<string> => {
    return invoke<string>('automation_ai_explain_selector_failure', {
      selector,
      pageUrl,
      errorMessage,
    });
  },

  /**
   * Batch heal multiple selectors
   */
  batchHeal: async (
    selectors: ElementSelector[],
    pageUrl: string
  ): Promise<Map<string, SelectorHealResult>> => {
    const results = new Map<string, SelectorHealResult>();

    for (const selector of selectors) {
      try {
        const result = await SelfHealingSelectorsService.healSelector(
          selector,
          pageUrl
        );
        results.set(selector.id, result);
      } catch (error) {
        results.set(selector.id, {
          success: false,
          originalSelector: selector.primary,
          confidence: 0,
          alternativesConsidered: 0,
          healingTime: 0,
          failureReason: String(error),
        });
      }
    }

    return results;
  },

  /**
   * Update selector success/failure stats
   */
  recordSelectorResult: async (
    selectorId: string,
    success: boolean,
    usedSelector: string,
    pageUrl: string
  ): Promise<void> => {
    return invoke('automation_record_selector_result', {
      selectorId,
      success,
      usedSelector,
      pageUrl,
    });
  },

  /**
   * Get selectors that need attention (low confidence or high fail rate)
   */
  getProblematicSelectors: async (
    threshold?: number
  ): Promise<ElementSelector[]> => {
    return invoke<ElementSelector[]>('automation_get_problematic_selectors', {
      confidenceThreshold: threshold || 70,
    });
  },

  /**
   * Export selectors for backup or sharing
   */
  exportSelectors: async (selectorIds?: string[]): Promise<string> => {
    return invoke<string>('automation_export_selectors', { selectorIds });
  },

  /**
   * Import selectors from backup
   */
  importSelectors: async (data: string): Promise<number> => {
    return invoke<number>('automation_import_selectors', { data });
  },
};

// ============================================================================
// Selector Utilities
// ============================================================================

export const SelectorUtils = {
  /**
   * Determine selector type from string
   */
  detectType: (selector: string): SelectorType => {
    if (selector.startsWith('//') || selector.startsWith('(//')) {
      return 'xpath';
    }
    if (selector.startsWith('#') && !selector.includes(' ')) {
      return 'id';
    }
    if (selector.startsWith('.') && !selector.includes(' ')) {
      return 'class';
    }
    if (selector.startsWith('[name=')) {
      return 'name';
    }
    if (selector.includes('[data-')) {
      return 'data-attribute';
    }
    if (selector.includes('[aria-')) {
      return 'aria';
    }
    if (selector.toLowerCase().startsWith('link=')) {
      return 'link-text';
    }
    if (selector.toLowerCase().startsWith('partial=')) {
      return 'partial-link-text';
    }
    if (selector.toLowerCase().startsWith('text=')) {
      return 'text';
    }
    return 'css';
  },

  /**
   * Calculate selector complexity score
   */
  calculateComplexity: (selector: string): number => {
    let score = 0;

    // Depth penalty
    const depth = (selector.match(/\s+/g) || []).length;
    score += depth * 5;

    // Index/position penalty
    if (selector.includes(':nth-') || selector.includes('[')) {
      score += 10;
    }

    // Length penalty
    score += Math.floor(selector.length / 20);

    // XPath complexity
    if (selector.includes('//')) {
      score += 5;
      const axes = ['ancestor', 'following', 'preceding', 'parent'];
      axes.forEach((axis) => {
        if (selector.includes(axis)) {
          score += 10;
        }
      });
    }

    return Math.min(score, 100);
  },

  /**
   * Check if selector is likely to be stable
   */
  isStableSelector: (selector: string): boolean => {
    // Good indicators
    const hasDataTestId = /data-testid|data-test|data-cy/.test(selector);
    const hasAriaLabel = /aria-label/.test(selector);
    const hasSimpleId = /^#[\w-]+$/.test(selector);

    // Bad indicators
    const hasIndex = /:nth-child|:nth-of-type|\[\d+\]/.test(selector);
    const hasGenericClass = /\.(row|col|container|wrapper|item)\b/.test(selector);
    const isVeryLong = selector.length > 100;

    if (hasDataTestId || hasAriaLabel || hasSimpleId) {
      return true;
    }
    if (hasIndex || hasGenericClass || isVeryLong) {
      return false;
    }
    return true;
  },

  /**
   * Generate a unique ID for a selector
   */
  generateId: (): string => {
    return `sel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Create an ElementSelector object
   */
  createSelector: (
    name: string,
    primary: string,
    type?: SelectorType
  ): ElementSelector => {
    return {
      id: SelectorUtils.generateId(),
      name,
      primary,
      type: type || SelectorUtils.detectType(primary),
      alternatives: [],
      healCount: 0,
      confidence: SelectorUtils.isStableSelector(primary) ? 80 : 50,
    };
  },
};

export default SelfHealingSelectorsService;
