/**
 * Smart Selector Builder - CUBE Nexum
 * Multi-mode selector builder with AI suggestions and auto-healing
 * Supera a Selenium IDE, Katalon, Playwright Inspector
 */

import React, { useState, useEffect } from 'react';
import { SelectorService } from '@/lib/services/workflow-service';
import type { SelectorResult, AIAlternative } from '@/lib/services/workflow-service';
import { Target, Code, Wand2, TestTube, CheckCircle, XCircle, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/services/logger-service';
import './SmartSelectorBuilder.css';

const log = logger.scope('SmartSelectorBuilder');

interface SmartSelectorBuilderProps {
  initialSelector?: string;
  pageUrl: string;
  onSelectSelector: (selector: string, type: string) => void;
  onClose: () => void;
}

export const SmartSelectorBuilder: React.FC<SmartSelectorBuilderProps> = ({
  initialSelector = '',
  pageUrl,
  onSelectSelector,
  onClose,
}) => {
  const [selectorMode, setSelectorMode] = useState<'css' | 'xpath' | 'text' | 'aria' | 'visual'>('css');
  const [currentSelector, setCurrentSelector] = useState(initialSelector);
  const [testResult, setTestResult] = useState<SelectorResult | null>(null);
  const [isTestting, setIsTesting] = useState(false);
  const [aiAlternatives, setAiAlternatives] = useState<AIAlternative[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [visualPickerActive, setVisualPickerActive] = useState(false);

  useEffect(() => {
    if (initialSelector) {
      testSelector(initialSelector, selectorMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testSelector = async (selector: string, mode: string) => {
    if (!selector.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await SelectorService.test(selector, mode, pageUrl);

      setTestResult(result);
    } catch (error) {
      log.error('Selector test failed:', error);
      setTestResult({
        selector,
        type: mode as 'css' | 'xpath' | 'text',
        score: 0,
        matchCount: 0,
        elements: [],
        robustness: 'low',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const generateAIAlternatives = async () => {
    if (!currentSelector.trim()) return;

    setIsGeneratingAI(true);
    setAiAlternatives([]);

    try {
      const alternatives = await SelectorService.generateAlternatives(
        currentSelector,
        pageUrl,
        {
          domStructure: testResult?.elements || [],
          currentScore: testResult?.score || 0,
        }
      );

      setAiAlternatives(alternatives);
    } catch (error) {
      log.error('AI generation failed:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const startVisualPicker = async () => {
    try {
      setVisualPickerActive(true);
      
      // Open visual picker in browser tab
      await SelectorService.startVisualPicker(pageUrl);
      
      // Wait for user to select element
      const selected = await SelectorService.waitForElementSelection();
      
      setCurrentSelector(selected.selector);
      setSelectorMode(selected.type as 'css' | 'xpath' | 'text');
      await testSelector(selected.selector, selected.type);
    } catch (error) {
      log.error('Visual picker failed:', error);
    } finally {
      setVisualPickerActive(false);
    }
  };

  const generateAutoHealingSelector = async () => {
    if (!currentSelector.trim()) return;

    setIsGeneratingAI(true);

    try {
      const healed = await SelectorService.generateAutoHealing(
        currentSelector,
        pageUrl,
        {
          fallbackCount: 3,
          includeXPath: true,
          includeCss: true,
          includeText: true,
        }
      );

      setCurrentSelector(healed);
      await testSelector(healed, selectorMode);
    } catch (error) {
      log.error('Auto-healing failed:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const copySelectorToClipboard = () => {
    navigator.clipboard.writeText(currentSelector);
  };

  const getRobustnessColor = (robustness: string) => {
    switch (robustness) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRobustnessIcon = (robustness: string) => {
    switch (robustness) {
      case 'high': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="smart-selector-builder">
      <div className="selector-builder-header">
        <h3 className="builder-title">
          <Target className="w-5 h-5" />
          Smart Selector Builder
        </h3>
        <button onClick={onClose} className="builder-close">
          ×
        </button>
      </div>

      {/* Mode Selector */}
      <div className="selector-modes">
        <button
          onClick={() => setSelectorMode('css')}
          className={`mode-btn ${selectorMode === 'css' ? 'active' : ''}`}
        >
          <Code className="w-4 h-4" />
          CSS
        </button>
        <button
          onClick={() => setSelectorMode('xpath')}
          className={`mode-btn ${selectorMode === 'xpath' ? 'active' : ''}`}
        >
          <Code className="w-4 h-4" />
          XPath
        </button>
        <button
          onClick={() => setSelectorMode('text')}
          className={`mode-btn ${selectorMode === 'text' ? 'active' : ''}`}
        >
          <Code className="w-4 h-4" />
          Text
        </button>
        <button
          onClick={() => setSelectorMode('aria')}
          className={`mode-btn ${selectorMode === 'aria' ? 'active' : ''}`}
        >
          <Code className="w-4 h-4" />
          ARIA
        </button>
        <button
          onClick={startVisualPicker}
          className={`mode-btn ${selectorMode === 'visual' ? 'active' : ''}`}
          disabled={visualPickerActive}
        >
          <Target className="w-4 h-4" />
          {visualPickerActive ? 'Picking...' : 'Visual'}
        </button>
      </div>

      {/* Selector Input */}
      <div className="selector-input-section">
        <textarea
          value={currentSelector}
          onChange={(e) => setCurrentSelector(e.target.value)}
          placeholder={`Enter ${selectorMode.toUpperCase()} selector...`}
          className="selector-textarea"
          rows={3}
        />
        <div className="selector-actions">
          <button
            onClick={() => testSelector(currentSelector, selectorMode)}
            disabled={isTestting || !currentSelector.trim()}
            className="btn-test"
          >
            <TestTube className="w-4 h-4" />
            {isTestting ? 'Testing...' : 'Test Selector'}
          </button>
          <button
            onClick={copySelectorToClipboard}
            disabled={!currentSelector.trim()}
            className="btn-copy"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className="test-result">
          <div className="result-header">
            <h4 className="result-title">Test Result</h4>
            <div className={`result-robustness ${getRobustnessColor(testResult.robustness)}`}>
              {getRobustnessIcon(testResult.robustness)}
              <span>{testResult.robustness.toUpperCase()}</span>
            </div>
          </div>
          <div className="result-stats">
            <div className="result-stat">
              <span className="stat-label">Matches:</span>
              <span className="stat-value">{testResult.matchCount}</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">Score:</span>
              <span className="stat-value">{Math.round(testResult.score * 100)}%</span>
            </div>
          </div>
          {testResult.matchCount > 0 && (
            <div className="result-elements">
              <p className="elements-title">Matched Elements:</p>
              <div className="elements-list">
                {testResult.elements.slice(0, 3).map((el, i) => (
                  <div key={i} className="element-preview">
                    <code>{el}</code>
                  </div>
                ))}
                {testResult.matchCount > 3 && (
                  <p className="elements-more">+ {testResult.matchCount - 3} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Features */}
      <div className="ai-features">
        <button
          onClick={generateAIAlternatives}
          disabled={isGeneratingAI || !currentSelector.trim()}
          className="btn-ai"
        >
          <Wand2 className="w-4 h-4" />
          {isGeneratingAI ? 'Generating...' : 'AI Suggestions'}
        </button>
        <button
          onClick={generateAutoHealingSelector}
          disabled={isGeneratingAI || !currentSelector.trim()}
          className="btn-ai"
        >
          <RefreshCw className="w-4 h-4" />
          Auto-Healing
        </button>
      </div>

      {/* AI Alternatives */}
      {aiAlternatives.length > 0 && (
        <div className="ai-alternatives">
          <h4 className="alternatives-title">AI Suggested Alternatives</h4>
          <div className="alternatives-list">
            {aiAlternatives.map((alt, i) => (
              <div key={i} className="alternative-item">
                <div className="alternative-header">
                  <code className="alternative-selector">{alt.selector}</code>
                  <span className="alternative-score">{Math.round(alt.score * 100)}%</span>
                  {alt.autoHealing && (
                    <span className="alternative-badge">Auto-Heal</span>
                  )}
                </div>
                <p className="alternative-reasoning">{alt.reasoning}</p>
                <div className="alternative-actions">
                  <button
                    onClick={async () => {
                      setCurrentSelector(alt.selector);
                      await testSelector(alt.selector, selectorMode);
                    }}
                    className="btn-test-alt"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => {
                      onSelectSelector(alt.selector, selectorMode);
                      onClose();
                    }}
                    className="btn-use-alt"
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="builder-footer">
        <button onClick={onClose} className="btn-cancel">
          Cancel
        </button>
        <button
          onClick={() => {
            onSelectSelector(currentSelector, selectorMode);
            onClose();
          }}
          disabled={!testResult || testResult.matchCount === 0}
          className="btn-confirm"
        >
          Use Selector
        </button>
      </div>
    </div>
  );
};
